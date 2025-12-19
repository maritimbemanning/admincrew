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
  // Use _raw to access actual DB fields that aren't in the normalized type
  const raw = candidate._raw
  const initialData: Partial<CandidateFormData> = {
    first_name: candidate.first_name,
    last_name: candidate.last_name,
    email: candidate.email,
    phone: candidate.phone || undefined,
    phone_secondary: raw?.mobile || undefined,
    date_of_birth: raw?.date_of_birth || undefined,
    nationality: raw?.nationality || undefined,
    national_id_number: raw?.national_id_hash || undefined,
    address_street: undefined, // Not in actual DB
    address_postal_code: undefined, // Not in actual DB
    address_city: raw?.city || undefined,
    address_country: raw?.country || 'NO',
    fylke: candidate.fylke || undefined,
    kommune: candidate.kommune || undefined,
    primary_role: candidate.primary_role,
    secondary_roles: candidate.secondary_roles || [],
    experience_years: candidate.experience_years || 0,
    languages: [{ code: 'no', level: 'native' as const }], // Not in actual DB
    sectors: candidate.sectors || [],
    cv_summary: raw?.skills || undefined,
    availability_status: candidate.availability_status,
    availability_date: candidate.availability_date || undefined,
    availability_notes: raw?.tilgjengelighet || undefined,
    rotation_preferred: [], // Not in actual DB
    rotation_max_weeks_on: undefined, // Not in actual DB
    rotation_min_weeks_off: undefined, // Not in actual DB
    rotation_flexible: true, // Not in actual DB
    salary_min_monthly_nok: undefined, // Not in actual DB
    salary_preferred_monthly_nok: undefined, // Not in actual DB
    salary_negotiable: true, // Not in actual DB
    location_preferred_regions: [], // Not in actual DB
    location_willing_to_relocate: false, // Not in actual DB
    internal_rating: candidate.internal_rating || undefined,
    internal_notes: candidate.internal_notes || undefined,
    tags: candidate.tags || [],
    compliance_status: candidate.compliance_status,
    compliance_notes: raw?.flagged_reason || undefined,
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
