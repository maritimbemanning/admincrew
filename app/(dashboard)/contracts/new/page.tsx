'use client'

import { ContractForm } from '@/components/contracts'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function NewContractContent() {
  const searchParams = useSearchParams()
  const assignmentId = searchParams.get('assignment_id') || undefined
  const organizationId = searchParams.get('organization_id') || undefined
  const candidateId = searchParams.get('candidate_id') || undefined

  return (
    <ContractForm
      assignmentId={assignmentId}
      organizationId={organizationId}
      candidateId={candidateId}
    />
  )
}

export default function NewContractPage() {
  return (
    <div className="container py-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/contracts">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til kontrakter
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Ny kontrakt</h1>
        <p className="text-muted-foreground mt-1">
          Opprett en ny kontrakt for signering
        </p>
      </div>

      <Suspense fallback={<div>Laster...</div>}>
        <NewContractContent />
      </Suspense>
    </div>
  )
}
