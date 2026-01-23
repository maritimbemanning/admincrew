'use client'

import { CandidateForm } from '@/components/candidates/candidate-form'

export default function NewCandidatePage() {
  return (
    <div className="container py-6 max-w-4xl">
      <CandidateForm mode="create" />
    </div>
  )
}
