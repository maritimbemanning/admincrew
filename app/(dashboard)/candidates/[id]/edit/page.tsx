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
  const initialData: Partial<CandidateFormData> = {
    first_name: candidate.first_name,
    last_name: candidate.last_name,
    email: candidate.email,
    phone: candidate.phone,
    phone_secondary: null, // Not in the full profile type
    date_of_birth: candidate.date_of_birth,
    nationality: candidate.nationality,
    national_id_number: candidate.national_id_number,
    address_street: candidate.address_street,
    address_postal_code: candidate.address_postal_code,
    address_city: candidate.address_city,
    address_country: candidate.address_country,
    fylke: candidate.fylke,
    kommune: candidate.kommune,
    primary_role: candidate.primary_role,
    secondary_roles: candidate.secondary_roles || [],
    experience_years: candidate.experience_years || 0,
    languages: Array.isArray(candidate.languages)
      ? (candidate.languages as Array<{ code: string; level: 'native' | 'fluent' | 'advanced' | 'intermediate' | 'basic' }>)
      : [{ code: 'no', level: 'native' as const }],
    sectors: candidate.sectors || [],
    cv_summary: candidate.cv_summary,
    availability_status: candidate.availability_status,
    availability_date: candidate.availability_date,
    availability_notes: candidate.availability_notes,
    rotation_preferred: candidate.rotation_preferred || [],
    rotation_max_weeks_on: candidate.rotation_max_weeks_on,
    rotation_min_weeks_off: candidate.rotation_min_weeks_off,
    rotation_flexible: candidate.rotation_flexible,
    salary_min_monthly_nok: candidate.salary_min_monthly_nok,
    salary_preferred_monthly_nok: candidate.salary_preferred_monthly_nok,
    salary_negotiable: candidate.salary_negotiable,
    location_preferred_regions: candidate.location_preferred_regions || [],
    location_willing_to_relocate: candidate.location_willing_to_relocate,
    internal_rating: candidate.internal_rating,
    internal_notes: candidate.internal_notes,
    tags: candidate.tags || [],
    compliance_status: candidate.compliance_status,
    compliance_notes: candidate.compliance_notes,
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
