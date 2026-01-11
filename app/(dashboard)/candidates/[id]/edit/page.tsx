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
    // Identity
    first_name: candidate.first_name,
    last_name: candidate.last_name,
    email: candidate.email,
    phone: candidate.phone || undefined,

    // Professional
    primary_role: candidate.primary_role,
    secondary_roles: candidate.secondary_roles || [],
    experience_years: candidate.experience_years || 0,
    sectors: candidate.sectors || [],
    cv_summary: candidate.cv_summary || undefined,

    // Availability
    availability_status: candidate.availability_status as CandidateFormData['availability_status'],
    availability_date: candidate.availability_date || undefined,

    // Internal
    internal_rating: candidate.internal_rating || undefined,
    internal_notes: candidate.internal_notes || undefined,
    tags: candidate.tags || [],

    // Compliance
    compliance_status: candidate.compliance_status as CandidateFormData['compliance_status'],
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
