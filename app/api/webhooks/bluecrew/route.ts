import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

/**
 * POST /api/webhooks/bluecrew
 * 
 * Webhook for å motta oppdateringer fra bluecrew.no
 * Brukes for kandidat-synkronisering
 */
export async function POST(request: NextRequest) {
  try {
    // Verifiser webhook-signatur
    const signature = request.headers.get('x-webhook-signature')
    const timestamp = request.headers.get('x-webhook-timestamp')
    const body = await request.text()

    const webhookSecret = process.env.BLUECREW_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('BLUECREW_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    // Verifiser signatur
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(`${timestamp}.${body}`)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse body
    const payload = JSON.parse(body)
    const { event, data } = payload

    const supabase = await createClient()

    switch (event) {
      case 'candidate.created':
      case 'candidate.updated':
        await handleCandidateSync(supabase, data)
        break

      case 'candidate.deleted':
        await handleCandidateDelete(supabase, data)
        break

      default:
        console.log(`Unhandled webhook event: ${event}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCandidateSync(supabase: any, data: any) {
  const { bluecrew_id, ...candidateData } = data

  // Sjekk om kandidat finnes
  const { data: existing } = await supabase
    .from('candidates')
    .select('id')
    .eq('bluecrew_id', bluecrew_id)
    .single()

  if (existing) {
    // Oppdater eksisterende
    await supabase
      .from('candidates')
      .update({
        ...candidateData,
        updated_at: new Date().toISOString(),
        sync_status: 'synced',
        last_synced_at: new Date().toISOString(),
      })
      .eq('bluecrew_id', bluecrew_id)
  } else {
    // Opprett ny
    await supabase.from('candidates').insert({
      ...candidateData,
      bluecrew_id,
      sync_status: 'synced',
      last_synced_at: new Date().toISOString(),
    })
  }
}

async function handleCandidateDelete(supabase: any, data: any) {
  const { bluecrew_id } = data

  // Soft delete - sett til inactive
  await supabase
    .from('candidates')
    .update({
      availability_status: 'inactive',
      sync_status: 'deleted',
      updated_at: new Date().toISOString(),
    })
    .eq('bluecrew_id', bluecrew_id)
}
