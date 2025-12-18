// ══════════════════════════════════════════════════════════════════════════════════════
// DATABASE TYPES
// Generert basert på Supabase schema
// ══════════════════════════════════════════════════════════════════════════════════════

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ═══════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════

export type UserRole = 'super_admin' | 'admin' | 'recruiter' | 'coordinator' | 'employee'

export type AvailabilityStatus = 'available' | 'available_soon' | 'on_assignment' | 'unavailable' | 'inactive'

export type ComplianceStatus = 'not_started' | 'documents_pending' | 'review_pending' | 'approved' | 'expired' | 'rejected'

export type CertificationCategory = 'competency' | 'safety' | 'medical' | 'endorsement' | 'special' | 'other'

export type DocumentType = 'cv' | 'passport' | 'seabook' | 'certificate' | 'diploma' | 'reference' | 'contract' | 'other'

export type RequestStatus = 'draft' | 'pending_approval' | 'approved' | 'matching' | 'shortlisted' | 'offer_sent' | 'offer_accepted' | 'offer_rejected' | 'converted' | 'on_hold' | 'cancelled' | 'expired'

export type AssignmentStatus = 'draft' | 'pending_compliance' | 'compliance_ok' | 'contract_drafting' | 'contract_sent' | 'contract_signed' | 'ready_for_start' | 'active' | 'completed' | 'invoiced' | 'paid' | 'cancelled'

export type PipelineStage = 'lead' | 'contacted' | 'meeting_scheduled' | 'proposal_sent' | 'negotiation' | 'won' | 'lost' | 'churned'

export type DealStage = 'qualification' | 'needs_analysis' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'

export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task' | 'deal_created' | 'deal_won' | 'deal_lost' | 'request_created' | 'assignment_started' | 'contract_signed' | 'invoice_sent' | 'invoice_paid'

export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent'

export type ContractStatus = 'draft' | 'pending_review' | 'ready_for_signature' | 'sent' | 'partially_signed' | 'signed' | 'cancelled' | 'expired'

export type ContractType = 'employment_temporary' | 'employment_permanent' | 'contractor' | 'framework_agreement' | 'service_agreement'

export type TimesheetStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'invoiced'

export type QmsDocumentType = 'QH' | 'PRO' | 'INS' | 'SKJEMA'

export type QmsDocumentStatus = 'draft' | 'pending_approval' | 'approved' | 'obsolete'

export type NcSeverity = 'observation' | 'minor' | 'major' | 'critical'

export type NcStatus = 'open' | 'analysis' | 'action_planned' | 'action_implemented' | 'verified' | 'closed'

export type CapaType = 'corrective' | 'preventive'

export type CapaStatus = 'planned' | 'in_progress' | 'completed' | 'verified' | 'closed'

export type RiskCategory = 'operational' | 'financial' | 'compliance' | 'strategic' | 'reputational' | 'safety'

export type RiskStatus = 'identified' | 'assessed' | 'mitigated' | 'accepted' | 'closed'

// ═══════════════════════════════════════════════════════
// TABLE TYPES
// ═══════════════════════════════════════════════════════

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          avatar_url: string | null
          role: UserRole
          permissions: Json
          preferences: Json
          last_active_at: string | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone?: string | null
          avatar_url?: string | null
          role?: UserRole
          permissions?: Json
          preferences?: Json
          last_active_at?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          avatar_url?: string | null
          role?: UserRole
          permissions?: Json
          preferences?: Json
          last_active_at?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
      }
      candidates: {
        Row: {
          id: string
          user_id: string | null
          legacy_id: string | null
          legacy_source: string | null
          first_name: string
          last_name: string
          email: string
          phone: string | null
          phone_secondary: string | null
          date_of_birth: string | null
          nationality: string
          national_id_number: string | null
          address_street: string | null
          address_postal_code: string | null
          address_city: string | null
          address_country: string
          fylke: string | null
          kommune: string | null
          avatar_url: string | null
          primary_role: string
          secondary_roles: string[]
          experience_years: number
          experience_details: Json
          languages: Json
          rotation_preferred: string[]
          rotation_max_weeks_on: number | null
          rotation_min_weeks_off: number | null
          rotation_flexible: boolean
          salary_min_monthly_nok: number | null
          salary_preferred_monthly_nok: number | null
          salary_negotiable: boolean
          location_preferred_regions: string[]
          location_willing_to_relocate: boolean
          sectors: string[]
          availability_status: AvailabilityStatus
          availability_date: string | null
          availability_notes: string | null
          availability_updated_at: string | null
          compliance_status: ComplianceStatus
          compliance_checked_at: string | null
          compliance_checked_by: string | null
          compliance_notes: string | null
          compliance_expires_at: string | null
          profile_completeness: number
          cv_summary: string | null
          cv_file_path: string | null
          internal_rating: number | null
          internal_notes: string | null
          tags: string[]
          source: string
          source_details: Json | null
          referred_by: string | null
          created_at: string
          created_by: string | null
          updated_at: string
          updated_by: string | null
          archived_at: string | null
          archived_by: string | null
          archived_reason: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          legacy_id?: string | null
          legacy_source?: string | null
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          phone_secondary?: string | null
          date_of_birth?: string | null
          nationality?: string
          national_id_number?: string | null
          address_street?: string | null
          address_postal_code?: string | null
          address_city?: string | null
          address_country?: string
          fylke?: string | null
          kommune?: string | null
          avatar_url?: string | null
          primary_role: string
          secondary_roles?: string[]
          experience_years?: number
          experience_details?: Json
          languages?: Json
          rotation_preferred?: string[]
          rotation_max_weeks_on?: number | null
          rotation_min_weeks_off?: number | null
          rotation_flexible?: boolean
          salary_min_monthly_nok?: number | null
          salary_preferred_monthly_nok?: number | null
          salary_negotiable?: boolean
          location_preferred_regions?: string[]
          location_willing_to_relocate?: boolean
          sectors?: string[]
          availability_status?: AvailabilityStatus
          availability_date?: string | null
          availability_notes?: string | null
          availability_updated_at?: string | null
          compliance_status?: ComplianceStatus
          compliance_checked_at?: string | null
          compliance_checked_by?: string | null
          compliance_notes?: string | null
          compliance_expires_at?: string | null
          profile_completeness?: number
          cv_summary?: string | null
          cv_file_path?: string | null
          internal_rating?: number | null
          internal_notes?: string | null
          tags?: string[]
          source?: string
          source_details?: Json | null
          referred_by?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
          archived_at?: string | null
          archived_by?: string | null
          archived_reason?: string | null
        }
        Update: Partial<Database['public']['Tables']['candidates']['Insert']>
      }
      candidate_certifications: {
        Row: {
          id: string
          candidate_id: string
          category: CertificationCategory
          code: string
          name: string
          issuer: string | null
          issuer_country: string
          certificate_number: string | null
          issue_date: string | null
          expiry_date: string | null
          is_permanent: boolean
          document_path: string | null
          document_verified: boolean
          verified_by: string | null
          verified_at: string | null
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          candidate_id: string
          category: CertificationCategory
          code: string
          name: string
          issuer?: string | null
          issuer_country?: string
          certificate_number?: string | null
          issue_date?: string | null
          expiry_date?: string | null
          is_permanent?: boolean
          document_path?: string | null
          document_verified?: boolean
          verified_by?: string | null
          verified_at?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['candidate_certifications']['Insert']>
      }
      candidate_documents: {
        Row: {
          id: string
          candidate_id: string
          type: DocumentType
          name: string
          description: string | null
          file_path: string
          file_name: string
          file_size: number | null
          mime_type: string | null
          issue_date: string | null
          expiry_date: string | null
          document_number: string | null
          verified: boolean
          verified_by: string | null
          verified_at: string | null
          version: number
          is_current: boolean
          previous_version_id: string | null
          uploaded_at: string
          uploaded_by: string | null
          archived_at: string | null
          archived_by: string | null
        }
        Insert: {
          id?: string
          candidate_id: string
          type: DocumentType
          name: string
          description?: string | null
          file_path: string
          file_name: string
          file_size?: number | null
          mime_type?: string | null
          issue_date?: string | null
          expiry_date?: string | null
          document_number?: string | null
          verified?: boolean
          verified_by?: string | null
          verified_at?: string | null
          version?: number
          is_current?: boolean
          previous_version_id?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
          archived_at?: string | null
          archived_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['candidate_documents']['Insert']>
      }
      candidate_pools: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          color: string
          icon: string
          pool_type: string
          filter_criteria: Json | null
          candidate_count: number
          last_calculated_at: string | null
          is_system: boolean
          is_visible: boolean
          sort_order: number
          created_by: string | null
          created_at: string
          updated_at: string
          archived_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          color?: string
          icon?: string
          pool_type?: string
          filter_criteria?: Json | null
          candidate_count?: number
          last_calculated_at?: string | null
          is_system?: boolean
          is_visible?: boolean
          sort_order?: number
          created_by?: string | null
          created_at?: string
          updated_at?: string
          archived_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['candidate_pools']['Insert']>
      }
      candidate_pool_memberships: {
        Row: {
          id: string
          pool_id: string
          candidate_id: string
          added_by: string | null
          added_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          pool_id: string
          candidate_id: string
          added_by?: string | null
          added_at?: string
          notes?: string | null
        }
        Update: Partial<Database['public']['Tables']['candidate_pool_memberships']['Insert']>
      }
      crm_organizations: {
        Row: {
          id: string
          name: string
          org_number: string | null
          industry: string | null
          company_size: string | null
          customer_type: string
          website: string | null
          email: string | null
          phone: string | null
          address_street: string | null
          address_postal_code: string | null
          address_city: string | null
          address_country: string
          logo_url: string | null
          pipeline_stage: PipelineStage
          pipeline_entered_at: string
          pipeline_won_at: string | null
          pipeline_lost_at: string | null
          pipeline_lost_reason: string | null
          owner_id: string | null
          estimated_annual_value_nok: number | null
          lifetime_value_nok: number
          outstanding_amount_nok: number
          stats: Json
          preferences: Json
          notes: string | null
          tags: string[]
          created_at: string
          created_by: string | null
          updated_at: string
          updated_by: string | null
          archived_at: string | null
          archived_by: string | null
        }
        Insert: {
          id?: string
          name: string
          org_number?: string | null
          industry?: string | null
          company_size?: string | null
          customer_type?: string
          website?: string | null
          email?: string | null
          phone?: string | null
          address_street?: string | null
          address_postal_code?: string | null
          address_city?: string | null
          address_country?: string
          logo_url?: string | null
          pipeline_stage?: PipelineStage
          pipeline_entered_at?: string
          pipeline_won_at?: string | null
          pipeline_lost_at?: string | null
          pipeline_lost_reason?: string | null
          owner_id?: string | null
          estimated_annual_value_nok?: number | null
          lifetime_value_nok?: number
          outstanding_amount_nok?: number
          stats?: Json
          preferences?: Json
          notes?: string | null
          tags?: string[]
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
          archived_at?: string | null
          archived_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['crm_organizations']['Insert']>
      }
      crm_contacts: {
        Row: {
          id: string
          organization_id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          mobile: string | null
          job_title: string | null
          department: string | null
          is_primary: boolean
          is_decision_maker: boolean
          is_billing_contact: boolean
          is_operational_contact: boolean
          preferred_contact_method: string
          language: string
          linkedin_url: string | null
          avatar_url: string | null
          notes: string | null
          created_at: string
          created_by: string | null
          updated_at: string
          updated_by: string | null
          archived_at: string | null
          archived_by: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          mobile?: string | null
          job_title?: string | null
          department?: string | null
          is_primary?: boolean
          is_decision_maker?: boolean
          is_billing_contact?: boolean
          is_operational_contact?: boolean
          preferred_contact_method?: string
          language?: string
          linkedin_url?: string | null
          avatar_url?: string | null
          notes?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
          archived_at?: string | null
          archived_by?: string | null
        }
        Update: Partial<Database['public']['Tables']['crm_contacts']['Insert']>
      }
      customer_requests: {
        Row: {
          id: string
          request_number: string
          organization_id: string
          contact_id: string | null
          title: string
          description: string | null
          role_needed: string
          quantity: number
          start_date: string
          end_date: string | null
          duration_type: string
          requirements: Json
          work_location: string | null
          vessel_name: string | null
          vessel_type: string | null
          budget_max_daily_nok: number | null
          budget_max_monthly_nok: number | null
          estimated_value_nok: number | null
          status: RequestStatus
          priority: PriorityLevel
          matched_at: string | null
          matched_by: string | null
          match_count: number
          owner_id: string | null
          notes: string | null
          created_at: string
          created_by: string | null
          updated_at: string
          updated_by: string | null
          archived_at: string | null
        }
        Insert: {
          id?: string
          request_number?: string
          organization_id: string
          contact_id?: string | null
          title: string
          description?: string | null
          role_needed: string
          quantity?: number
          start_date: string
          end_date?: string | null
          duration_type?: string
          requirements?: Json
          work_location?: string | null
          vessel_name?: string | null
          vessel_type?: string | null
          budget_max_daily_nok?: number | null
          budget_max_monthly_nok?: number | null
          estimated_value_nok?: number | null
          status?: RequestStatus
          priority?: PriorityLevel
          matched_at?: string | null
          matched_by?: string | null
          match_count?: number
          owner_id?: string | null
          notes?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
          archived_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['customer_requests']['Insert']>
      }
      assignments: {
        Row: {
          id: string
          assignment_number: string
          request_id: string | null
          organization_id: string
          contact_id: string | null
          candidate_id: string
          title: string
          description: string | null
          role: string
          planned_start_date: string
          planned_end_date: string | null
          actual_start_date: string | null
          actual_end_date: string | null
          work_location: string | null
          vessel_name: string | null
          vessel_imo: string | null
          employee_rate_type: string
          employee_rate_amount_nok: number | null
          billing_rate_type: string
          billing_rate_amount_nok: number | null
          overtime_rate_multiplier: number
          status: AssignmentStatus
          release_checklist: Json
          internal_notes: string | null
          client_notes: string | null
          owner_id: string | null
          created_at: string
          created_by: string | null
          updated_at: string
          updated_by: string | null
          archived_at: string | null
        }
        Insert: {
          id?: string
          assignment_number?: string
          request_id?: string | null
          organization_id: string
          contact_id?: string | null
          candidate_id: string
          title: string
          description?: string | null
          role: string
          planned_start_date: string
          planned_end_date?: string | null
          actual_start_date?: string | null
          actual_end_date?: string | null
          work_location?: string | null
          vessel_name?: string | null
          vessel_imo?: string | null
          employee_rate_type?: string
          employee_rate_amount_nok?: number | null
          billing_rate_type?: string
          billing_rate_amount_nok?: number | null
          overtime_rate_multiplier?: number
          status?: AssignmentStatus
          release_checklist?: Json
          internal_notes?: string | null
          client_notes?: string | null
          owner_id?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
          archived_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['assignments']['Insert']>
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_staff: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: UserRole
      availability_status: AvailabilityStatus
      compliance_status: ComplianceStatus
      certification_category: CertificationCategory
      document_type: DocumentType
      request_status: RequestStatus
      assignment_status: AssignmentStatus
      pipeline_stage: PipelineStage
      deal_stage: DealStage
      activity_type: ActivityType
      priority_level: PriorityLevel
      contract_status: ContractStatus
      contract_type: ContractType
      timesheet_status: TimesheetStatus
    }
  }
}

// ═══════════════════════════════════════════════════════
// CONVENIENCE TYPES
// ═══════════════════════════════════════════════════════

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Shortcuts
export type UserProfile = Tables<'user_profiles'>
export type Candidate = Tables<'candidates'>
export type CandidateCertification = Tables<'candidate_certifications'>
export type CandidateDocument = Tables<'candidate_documents'>
export type CandidatePool = Tables<'candidate_pools'>
export type Organization = Tables<'crm_organizations'>
export type Contact = Tables<'crm_contacts'>
export type CustomerRequest = Tables<'customer_requests'>
export type Assignment = Tables<'assignments'>
