'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'
import { CandidateForm, CandidateFormSkeleton } from '@/components/candidates/candidate-form'
import { useCandidate } from '@/hooks'
import type { CandidateFormData } from '@/lib/validations/candidate'

interface EditCandidatePageProps {
  params: Promise<{ id: string }>
}

export default function EditCandidatePage({ params }: EditCandidatePageProps) {
  const { id } = use(params)
  const { data: candidate, isLoading, error } = useCandidate(id)

  if (isLoading) {
    return (
      <div className="container py-6 max-w-4xl">
        <CandidateFormSkeleton />
      </div>
    )
  }

  if (error || !candidate) {
    notFound()
  }

  // Transform candidate data to form data format
  // Use _raw to access actual DB fields
  const raw = candidate._raw
  const initialData: Partial<CandidateFormData> = {
    // Identity - use raw fields that exist in actual DB
    first_name: candidate.first_name,
    last_name: candidate.last_name,
    email: candidate.email,
    phone: candidate.phone || undefined,
    mobile: raw?.mobile || undefined,
    date_of_birth: raw?.date_of_birth || undefined,
    nationality: raw?.nationality || undefined,

    // Location - actual DB columns
    fylke: candidate.fylke || undefined,
    kommune: candidate.kommune || undefined,
    city: raw?.city || undefined,
    country: raw?.country || 'NO',

    // Professional - actual DB columns
    primary_role: candidate.primary_role,
    secondary_roles: candidate.secondary_roles || [],
    experience_years: candidate.experience_years || 0,
    sectors: candidate.sectors || [],
    cv_summary: candidate.cv_summary || undefined,

    // Availability - actual DB columns
    availability_status: candidate.availability_status as CandidateFormData['availability_status'],
    availability_date: candidate.availability_date || undefined,
    available_until: raw?.available_until || undefined,

    // Rate/Compensation - actual DB columns
    expected_daily_rate: raw?.expected_daily_rate || undefined,
    currency: raw?.currency || 'NOK',
    preferred_contract_length_months: raw?.preferred_contract_length_months || undefined,

    // Internal - actual DB columns
    internal_rating: candidate.internal_rating || undefined,
    internal_notes: candidate.internal_notes || undefined,
    tags: candidate.tags || [],

    // Compliance - actual DB columns
    compliance_status: candidate.compliance_status as CandidateFormData['compliance_status'],
    flagged_reason: raw?.flagged_reason || undefined,
  }

  return (
    <div className="container py-6 max-w-4xl">
      <CandidateForm
        mode="edit"
        candidateId={id}
        initialData={initialData}
      />
    </div>
  )
}
