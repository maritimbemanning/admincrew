/**
 * @fileoverview Bluecrew.no Webhook Handler
 *
 * This API route handles incoming webhooks from the bluecrew.no public website,
 * enabling real-time synchronization of candidate data into the AdminCrew system.
 *
 * ## Architecture Overview
 *
 * ```
 * bluecrew.no (public site)
 *       │
 *       ▼ (pg_net trigger on candidate changes)
 * ┌─────────────────────────────────────────┐
 * │  POST /api/webhooks/bluecrew            │
 * │  - Signature verification (HMAC-SHA256) │
 * │  - Timestamp validation (replay attack) │
 * │  - Event routing                        │
 * └─────────────────────────────────────────┘
 *       │
 *       ▼
 * ┌─────────────────────────────────────────┐
 * │  AdminCrew Supabase Database            │
 * │  - candidates table                     │
 * │  - candidate_certifications table       │
 * └─────────────────────────────────────────┘
 * ```
 *
 * ## Supported Events
 *
 * | Event               | Handler                | Description                        |
 * |---------------------|------------------------|------------------------------------|
 * | `candidate.created` | `handleCandidateCreate`| New candidate registered           |
 * | `candidate.updated` | `handleCandidateUpdate`| Candidate profile modified         |
 * | `candidate.deleted` | `handleCandidateDelete`| Candidate removed (soft delete)    |
 *
 * ## Security
 *
 * All requests must include:
 * - `x-webhook-signature`: HMAC-SHA256 signature of `{timestamp}.{body}`
 * - `x-webhook-timestamp`: Unix timestamp (must be within 5 minutes)
 *
 * ## Data Flow
 *
 * 1. Candidate registers/updates on bluecrew.no
 * 2. Supabase pg_net trigger fires webhook to this endpoint
 * 3. Webhook is verified and processed
 * 4. Candidate data is upserted into AdminCrew database
 * 5. Certifications are synced using bluecrew→admincrew mapping
 *
 * ## Important Notes
 *
 * - bluecrew.no is a READ-ONLY source - we never write back to it
 * - Candidates are linked via `legacy_id` field (bluecrew_id)
 * - Deletions are soft deletes (archived, not removed)
 * - Certifications use upsert logic to avoid duplicates
 *
 * @module api/webhooks/bluecrew
 * @see {@link https://docs.bluecrew.no/webhooks} Bluecrew Webhook Documentation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createHmac, timingSafeEqual } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

// ══════════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Webhook event types supported by bluecrew.no
 */
type WebhookEventType = 'candidate.created' | 'candidate.updated' | 'candidate.deleted'

/**
 * Certification data format from bluecrew.no
 *
 * The bluecrew.no system uses a flat structure with boolean flags and optional
 * class/type identifiers. This differs from AdminCrew's normalized certification
 * records.
 *
 * @example
 * ```json
 * {
 *   "stcw_has": true,
 *   "stcw_mod": ["VI/1", "VI/2", "VI/3"],
 *   "deck_has": true,
 *   "deck_class": "D3",
 *   "machine_has": false,
 *   "radio_has": true,
 *   "radio_type": "GMDSS GOC"
 * }
 * ```
 */
interface BluecrewCertifications {
  /** Whether candidate holds STCW basic safety training */
  stcw_has?: boolean
  /** STCW modules completed (e.g., ["VI/1", "VI/2", "VI/3"]) */
  stcw_mod?: string[]
  /** Whether candidate holds deck officer certificate */
  deck_has?: boolean
  /** Deck officer class (e.g., "D1", "D2", "D3", "D4", "D5") */
  deck_class?: string
  /** Whether candidate holds marine engineer certificate */
  machine_has?: boolean
  /** Marine engineer class (e.g., "M1", "M2", "M3", "M4", "M5") */
  machine_class?: string
  /** Whether candidate holds radio operator certificate */
  radio_has?: boolean
  /** Radio certificate type (e.g., "GMDSS GOC", "GMDSS ROC", "SRC") */
  radio_type?: string
}

/**
 * Candidate data payload from bluecrew.no webhook
 *
 * This interface represents the candidate data structure sent by bluecrew.no.
 * Fields are mapped to the AdminCrew candidates table during processing.
 */
interface BluecrewCandidatePayload {
  /** Unique identifier from bluecrew.no (stored as legacy_id) */
  bluecrew_id: string
  /** Candidate's first name */
  first_name?: string
  /** Candidate's last name */
  last_name?: string
  /** Primary email address */
  email?: string
  /** Primary phone number */
  phone?: string
  /** Primary maritime role (e.g., "Matros", "Dekksoffiser", "Maskinist") */
  primary_role?: string
  /** Years of maritime experience */
  experience_years?: number
  /** Structured certification data */
  certifications?: BluecrewCertifications
  /** Additional source tracking metadata */
  source_details?: Record<string, unknown>
  /** Any additional candidate fields passed through */
  [key: string]: unknown
}

/**
 * Webhook request payload structure
 */
interface WebhookPayload {
  /** Event type identifier */
  event: WebhookEventType
  /** Event-specific data */
  data: BluecrewCandidatePayload
}

/**
 * AdminCrew certification record for database insertion
 */
interface AdminCrewCertification {
  /** Reference to the candidate */
  candidate_id: string
  /** Certification name (e.g., "STCW", "Dekksoffiser D3") */
  name: string
  /** Category: 'safety', 'competency', or 'endorsement' */
  category: 'safety' | 'competency' | 'endorsement'
  /** Norwegian authority that issues this certification */
  issuing_authority: string
  /** Verification status (defaults to false for new imports) */
  is_verified: boolean
  /** Additional metadata (e.g., STCW modules) */
  metadata?: Record<string, unknown>
}

// ══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Shared secret for HMAC signature verification.
 * Must match the secret configured in bluecrew.no webhook settings.
 */
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET

/**
 * Maximum age (in seconds) for webhook timestamps.
 * Requests older than this are rejected to prevent replay attacks.
 */
const TIMESTAMP_MAX_AGE_SECONDS = 300 // 5 minutes

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Verifies the HMAC-SHA256 signature of an incoming webhook request.
 *
 * This function implements a secure signature verification process to ensure
 * that webhook requests originate from bluecrew.no and haven't been tampered with.
 *
 * ## Verification Process
 *
 * 1. **Presence check**: Ensures all required values are present
 * 2. **Timestamp validation**: Rejects requests older than 5 minutes (replay attack prevention)
 * 3. **Signature computation**: Calculates expected HMAC-SHA256 of `{timestamp}.{payload}`
 * 4. **Timing-safe comparison**: Compares signatures without leaking timing information
 *
 * ## Signature Format
 *
 * The signature header format is: `sha256={hex-encoded-hmac}`
 *
 * The signed payload is constructed as: `{unix-timestamp}.{raw-body}`
 *
 * @param payload - Raw request body as string (JSON)
 * @param signature - Value of `x-webhook-signature` header (format: `sha256=...`)
 * @param timestamp - Value of `x-webhook-timestamp` header (Unix timestamp in seconds)
 *
 * @returns `true` if signature is valid and timestamp is within acceptable range
 *
 * @example
 * ```typescript
 * const rawBody = await request.text()
 * const signature = request.headers.get('x-webhook-signature')
 * const timestamp = request.headers.get('x-webhook-timestamp')
 *
 * if (!verifySignature(rawBody, signature, timestamp)) {
 *   return new Response('Unauthorized', { status: 401 })
 * }
 * ```
 *
 * @security
 * - Uses timing-safe comparison to prevent timing attacks
 * - Rejects timestamps outside 5-minute window to prevent replay attacks
 * - Requires WEBHOOK_SECRET environment variable to be set
 */
function verifySignature(
  payload: string,
  signature: string | null,
  timestamp: string | null
): boolean {
  // Validate all required values are present
  if (!WEBHOOK_SECRET || !signature || !timestamp) {
    return false
  }

  // Parse and validate timestamp to prevent replay attacks
  const timestampNum = parseInt(timestamp, 10)
  const now = Math.floor(Date.now() / 1000)

  if (Math.abs(now - timestampNum) > TIMESTAMP_MAX_AGE_SECONDS) {
    console.error('[WEBHOOK] Timestamp too old or invalid:', {
      received: timestampNum,
      current: now,
      diffSeconds: Math.abs(now - timestampNum),
    })
    return false
  }

  // Compute expected signature using HMAC-SHA256
  // The signed payload format matches bluecrew.no's signing implementation
  const signedPayload = `${timestamp}.${payload}`
  const expectedSignature = createHmac('sha256', WEBHOOK_SECRET)
    .update(signedPayload)
    .digest('hex')

  // Use timing-safe comparison to prevent timing attacks
  // This ensures comparison time is constant regardless of where strings differ
  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(`sha256=${expectedSignature}`)
    )
  } catch {
    // Buffer length mismatch or other error - signature is invalid
    return false
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// API ROUTE HANDLER
// ══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/webhooks/bluecrew
 *
 * Receives and processes webhook events from bluecrew.no for candidate synchronization.
 * This endpoint is called by a Supabase pg_net trigger whenever candidate data
 * changes on the bluecrew.no website.
 *
 * ## Required Headers
 *
 * | Header                | Description                              | Example                    |
 * |-----------------------|------------------------------------------|----------------------------|
 * | `x-webhook-signature` | HMAC-SHA256 signature                    | `sha256=abc123...`         |
 * | `x-webhook-timestamp` | Unix timestamp (seconds)                 | `1704067200`               |
 * | `x-webhook-source`    | Source identifier (optional, for logging)| `bluecrew_v3`              |
 *
 * ## Request Body
 *
 * ```json
 * {
 *   "event": "candidate.created" | "candidate.updated" | "candidate.deleted",
 *   "data": {
 *     "bluecrew_id": "uuid",
 *     "first_name": "Ola",
 *     "last_name": "Nordmann",
 *     "email": "ola@example.com",
 *     "certifications": { ... }
 *   }
 * }
 * ```
 *
 * ## Response Codes
 *
 * | Status | Description                                      |
 * |--------|--------------------------------------------------|
 * | 200    | Webhook processed successfully                   |
 * | 401    | Invalid or missing signature/timestamp           |
 * | 500    | Internal processing error                        |
 *
 * ## Example Usage (from bluecrew.no)
 *
 * ```bash
 * curl -X POST https://admincrew.example.com/api/webhooks/bluecrew \
 *   -H "Content-Type: application/json" \
 *   -H "x-webhook-signature: sha256=$(echo -n "$TIMESTAMP.$BODY" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)" \
 *   -H "x-webhook-timestamp: $TIMESTAMP" \
 *   -d '{"event": "candidate.created", "data": {...}}'
 * ```
 *
 * @param request - Next.js request object with headers and body
 * @returns JSON response indicating success or failure
 *
 * @throws Returns 401 for authentication failures
 * @throws Returns 500 for processing errors (with details in response)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const signature = request.headers.get('x-webhook-signature')
    const timestamp = request.headers.get('x-webhook-timestamp')
    const source = request.headers.get('x-webhook-source')

    // Get raw body for signature verification
    const rawBody = await request.text()

    // Verify signature
    if (!verifySignature(rawBody, signature, timestamp)) {
      console.error('[WEBHOOK] Invalid signature or missing WEBHOOK_SECRET')
      return NextResponse.json(
        { error: 'Unauthorized - invalid signature' },
        { status: 401 }
      )
    }

    console.log(`[WEBHOOK] Verified request from: ${source}, timestamp: ${timestamp}`)

    // Parse body (already read as text for signature verification)
    const payload = JSON.parse(rawBody)
    const { event, data } = payload

    console.log(`[WEBHOOK] Event: ${event}`)
    console.log(`[WEBHOOK] Data:`, JSON.stringify(data, null, 2))

    // Bruk admin client for å unngå RLS
    const supabase = createAdminClient()

    switch (event) {
      case 'candidate.created':
        await handleCandidateCreate(supabase, data)
        break
        
      case 'candidate.updated':
        await handleCandidateUpdate(supabase, data)
        break

      case 'candidate.deleted':
        await handleCandidateDelete(supabase, data)
        break

      default:
        console.log(`[WEBHOOK] Unhandled event: ${event}`)
    }

    return NextResponse.json({ received: true, event })
  } catch (error) {
    console.error('[WEBHOOK] Error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed', details: String(error) },
      { status: 500 }
    )
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Handles the `candidate.created` webhook event.
 *
 * Creates a new candidate record in AdminCrew from bluecrew.no registration data.
 * Includes duplicate detection to handle potential race conditions or retries.
 *
 * ## Processing Steps
 *
 * 1. Check for existing candidate with same `legacy_id` (duplicate protection)
 * 2. If duplicate found, delegate to update handler (idempotent behavior)
 * 3. Insert new candidate with default statuses
 * 4. Sync certifications if provided
 *
 * ## Field Mappings
 *
 * | Bluecrew Field   | AdminCrew Field     | Notes                           |
 * |------------------|---------------------|---------------------------------|
 * | `bluecrew_id`    | `legacy_id`         | Links records between systems   |
 * | -                | `legacy_source`     | Set to `'bluecrew_v3'`          |
 * | -                | `compliance_status` | Set to `'not_started'`          |
 * | -                | `status`            | Set to `'active'`               |
 * | -                | `source`            | Set to `'bluecrew_website'`     |
 * | All others       | Same name           | Passed through directly         |
 *
 * @param supabase - Supabase admin client (bypasses RLS)
 * @param data - Candidate data from webhook payload
 *
 * @throws Throws Supabase error if insert fails (after logging)
 *
 * @example
 * ```typescript
 * await handleCandidateCreate(supabase, {
 *   bluecrew_id: 'abc-123',
 *   first_name: 'Ola',
 *   last_name: 'Nordmann',
 *   email: 'ola@example.com',
 *   primary_role: 'Matros',
 *   certifications: { stcw_has: true, stcw_mod: ['VI/1', 'VI/2'] }
 * })
 * ```
 */
async function handleCandidateCreate(
  supabase: SupabaseClient,
  data: BluecrewCandidatePayload
): Promise<void> {
  const { bluecrew_id, certifications, source_details, ...candidateData } = data

  // Duplicate protection: Check if candidate already exists by legacy_id
  // This handles webhook retries, network issues, and race conditions
  const { data: existing } = await supabase
    .from('candidates')
    .select('id')
    .eq('legacy_id', bluecrew_id)
    .single()

  if (existing) {
    // Candidate exists - treat as update for idempotent behavior
    console.log(`[WEBHOOK] Kandidat ${bluecrew_id} eksisterer allerede, oppdaterer...`)
    return handleCandidateUpdate(supabase, data)
  }

  // Insert new candidate with system defaults
  const { data: newCandidate, error } = await supabase
    .from('candidates')
    .insert({
      ...candidateData,
      legacy_id: bluecrew_id,          // Link to bluecrew.no record
      legacy_source: 'bluecrew_v3',     // Source system identifier
      compliance_status: 'not_started', // New candidates need compliance review
      status: 'active',                 // Active in the system
      source: 'bluecrew_website',       // Acquisition channel
      source_details: source_details || {},
    })
    .select()
    .single()

  if (error) {
    console.error(`[WEBHOOK] Insert error:`, error)
    throw error
  }

  console.log(`[WEBHOOK] Created candidate: ${newCandidate.id}`)

  // Sync certifications if provided in the payload
  if (certifications && newCandidate) {
    await syncCertifications(supabase, newCandidate.id, certifications)
  }
}

/**
 * Handles the `candidate.updated` webhook event.
 *
 * Updates an existing candidate record in AdminCrew when their profile
 * changes on bluecrew.no.
 *
 * ## Processing Steps
 *
 * 1. Update candidate fields (excluding certifications and source_details)
 * 2. Set `updated_at` timestamp
 * 3. If certifications provided, sync them separately
 *
 * ## Notes
 *
 * - Uses `legacy_id` to find the candidate (not AdminCrew's internal ID)
 * - Does NOT update `source_details` to preserve original acquisition data
 * - Certification sync uses upsert logic (won't duplicate existing certs)
 *
 * @param supabase - Supabase admin client (bypasses RLS)
 * @param data - Updated candidate data from webhook payload
 *
 * @throws Throws Supabase error if update fails (after logging)
 *
 * @example
 * ```typescript
 * await handleCandidateUpdate(supabase, {
 *   bluecrew_id: 'abc-123',
 *   primary_role: 'Styrmann',  // Changed from Matros
 *   experience_years: 5,        // Updated experience
 * })
 * ```
 */
async function handleCandidateUpdate(
  supabase: SupabaseClient,
  data: BluecrewCandidatePayload
): Promise<void> {
  const { bluecrew_id, certifications, source_details, ...candidateData } = data

  // Update candidate by legacy_id with new timestamp
  const { error } = await supabase
    .from('candidates')
    .update({
      ...candidateData,
      updated_at: new Date().toISOString(),
    })
    .eq('legacy_id', bluecrew_id)

  if (error) {
    console.error(`[WEBHOOK] Update error:`, error)
    throw error
  }

  console.log(`[WEBHOOK] Updated candidate: ${bluecrew_id}`)

  // Sync certifications if provided
  // Requires fetching internal candidate ID first
  if (certifications) {
    const { data: candidate } = await supabase
      .from('candidates')
      .select('id')
      .eq('legacy_id', bluecrew_id)
      .single()

    if (candidate) {
      await syncCertifications(supabase, candidate.id, certifications)
    }
  }
}

/**
 * Handles the `candidate.deleted` webhook event.
 *
 * Performs a **soft delete** on the candidate record. We never hard-delete
 * candidates because:
 *
 * 1. **Data integrity**: Candidates may have assignments, contracts, or history
 * 2. **Audit trail**: Need to maintain records for compliance/reporting
 * 3. **Recovery**: Accidental deletions on bluecrew.no can be reversed
 * 4. **Legal**: GDPR may require retention of certain employment records
 *
 * ## Soft Delete Strategy
 *
 * Instead of deleting the record, we:
 * - Set `availability_status` to `'inactive'` (removes from matching)
 * - Set `archived_at` timestamp (marks as archived)
 * - Set `archived_reason` (documents the source of archival)
 *
 * ## Restoration
 *
 * To restore a soft-deleted candidate:
 * ```sql
 * UPDATE candidates
 * SET availability_status = 'available',
 *     archived_at = NULL,
 *     archived_reason = NULL
 * WHERE legacy_id = 'bluecrew-id';
 * ```
 *
 * @param supabase - Supabase admin client (bypasses RLS)
 * @param data - Deletion event data containing bluecrew_id
 *
 * @throws Throws Supabase error if soft delete fails (after logging)
 *
 * @example
 * ```typescript
 * await handleCandidateDelete(supabase, {
 *   bluecrew_id: 'abc-123'
 * })
 * // Candidate is now archived, not deleted
 * ```
 */
async function handleCandidateDelete(
  supabase: SupabaseClient,
  data: BluecrewCandidatePayload
): Promise<void> {
  const { bluecrew_id } = data

  // Soft delete: Archive the candidate instead of deleting
  const { error } = await supabase
    .from('candidates')
    .update({
      availability_status: 'inactive',              // Remove from matching engine
      archived_at: new Date().toISOString(),        // Timestamp for audit
      archived_reason: 'Deleted from bluecrew.no',  // Source of archival
    })
    .eq('legacy_id', bluecrew_id)

  if (error) {
    console.error(`[WEBHOOK] Delete error:`, error)
    throw error
  }

  console.log(`[WEBHOOK] Soft-deleted candidate: ${bluecrew_id}`)
}

// ══════════════════════════════════════════════════════════════════════════════
// CERTIFICATION SYNCHRONIZATION
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Synchronizes certifications from bluecrew.no format to AdminCrew format.
 *
 * Bluecrew.no uses a flat boolean-based certification structure, while AdminCrew
 * uses normalized certification records. This function handles the transformation
 * and upsert logic.
 *
 * ## Certification Mapping
 *
 * | Bluecrew Field  | AdminCrew Name                | Category     | Issuing Authority                   |
 * |-----------------|-------------------------------|--------------|-------------------------------------|
 * | `stcw_has`      | `STCW`                        | `safety`     | Sjøfartsdirektoratet                |
 * | `deck_has`      | `Dekksoffiser {deck_class}`   | `competency` | Sjøfartsdirektoratet                |
 * | `machine_has`   | `Maskinoffiser {machine_class}`| `competency`| Sjøfartsdirektoratet                |
 * | `radio_has`     | `Radiosertifikat {radio_type}`| `endorsement`| Nasjonal kommunikasjonsmyndighet    |
 *
 * ## Category Definitions
 *
 * - **safety**: Basic safety training (STCW mandatory for all seafarers)
 * - **competency**: Role-specific officer certificates (deck/engine)
 * - **endorsement**: Additional qualifications (radio, medical, etc.)
 *
 * ## Upsert Strategy
 *
 * Uses "check-then-insert" pattern instead of DELETE+INSERT because:
 * 1. Preserves AdminCrew-specific data (expiry dates, verification status)
 * 2. Maintains audit trail of when certs were added
 * 3. Avoids race conditions with concurrent webhook calls
 *
 * ## Norwegian Maritime Authorities
 *
 * - **Sjøfartsdirektoratet** (Norwegian Maritime Authority): Issues STCW and officer certs
 * - **Nasjonal kommunikasjonsmyndighet** (NKOM): Issues radio operator certificates
 *
 * @param supabase - Supabase admin client (bypasses RLS)
 * @param candidateId - AdminCrew internal candidate UUID
 * @param certs - Certification data in bluecrew.no format
 *
 * @example
 * ```typescript
 * // Bluecrew format
 * const bluecrewCerts = {
 *   stcw_has: true,
 *   stcw_mod: ['VI/1', 'VI/2', 'VI/3'],
 *   deck_has: true,
 *   deck_class: 'D3',
 *   machine_has: false,
 *   radio_has: true,
 *   radio_type: 'GMDSS GOC'
 * }
 *
 * // This creates 3 certification records:
 * // 1. STCW (safety) with modules metadata
 * // 2. Dekksoffiser D3 (competency)
 * // 3. Radiosertifikat GMDSS GOC (endorsement)
 * await syncCertifications(supabase, candidateId, bluecrewCerts)
 * ```
 */
async function syncCertifications(
  supabase: SupabaseClient,
  candidateId: string,
  certs: BluecrewCertifications
): Promise<void> {
  // Transform bluecrew flat structure to AdminCrew normalized records
  const certifications: AdminCrewCertification[] = []

  // STCW Basic Safety Training
  // Required for all seafarers under SOLAS convention
  if (certs.stcw_has) {
    certifications.push({
      candidate_id: candidateId,
      name: 'STCW',
      category: 'safety',
      issuing_authority: 'Sjøfartsdirektoratet',
      is_verified: false, // Must be manually verified with document
      metadata: { modules: certs.stcw_mod }, // Store individual STCW modules
    })
  }

  // Deck Officer Certificate (D1-D5)
  // Classes: D1 (Master), D2 (Chief Mate), D3 (OOW), D4/D5 (Near coastal)
  if (certs.deck_has) {
    certifications.push({
      candidate_id: candidateId,
      name: `Dekksoffiser ${certs.deck_class || ''}`.trim(),
      category: 'competency',
      issuing_authority: 'Sjøfartsdirektoratet',
      is_verified: false,
    })
  }

  // Marine Engineer Certificate (M1-M5)
  // Classes: M1 (Chief Engineer), M2-M5 (various power limits)
  if (certs.machine_has) {
    certifications.push({
      candidate_id: candidateId,
      name: `Maskinoffiser ${certs.machine_class || ''}`.trim(),
      category: 'competency',
      issuing_authority: 'Sjøfartsdirektoratet',
      is_verified: false,
    })
  }

  // Radio Operator Certificate
  // Types: GMDSS GOC (General), GMDSS ROC (Restricted), SRC (Short Range)
  if (certs.radio_has) {
    certifications.push({
      candidate_id: candidateId,
      name: `Radiosertifikat ${certs.radio_type || ''}`.trim(),
      category: 'endorsement',
      issuing_authority: 'Nasjonal kommunikasjonsmyndighet', // NKOM
      is_verified: false,
    })
  }

  // Upsert certifications using check-then-insert pattern
  // This preserves existing AdminCrew-specific data while adding new certs
  if (certifications.length > 0) {
    for (const cert of certifications) {
      // Check if this exact certification already exists
      const { data: existing } = await supabase
        .from('candidate_certifications')
        .select('id')
        .eq('candidate_id', candidateId)
        .eq('name', cert.name)
        .single()

      // Only insert if not already present
      if (!existing) {
        await supabase.from('candidate_certifications').insert(cert)
        console.log(`[WEBHOOK] Added certification: ${cert.name}`)
      }
      // Note: We don't update existing certs to preserve AdminCrew edits
      // (expiry dates, verification status, etc.)
    }
  }
}
