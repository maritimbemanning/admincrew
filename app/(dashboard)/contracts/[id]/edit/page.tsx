'use client'

import { useParams } from 'next/navigation'
import { useContract } from '@/hooks/use-contracts'
import { ContractForm } from '@/components/contracts'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditContractPage() {
  const params = useParams()
  const contractId = params.id as string

  const { data: contract, isLoading, error } = useContract(contractId)

  if (isLoading) {
    return (
      <div className="container py-6 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-6">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[100px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-destructive">Kunne ikke laste kontrakt</p>
          <Link href="/contracts">
            <Button variant="outline" className="mt-4">
              Gå tilbake
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Only allow editing draft or pending_review contracts
  if (!['draft', 'pending_review'].includes(contract.status)) {
    return (
      <div className="container py-6">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">
            Denne kontrakten kan ikke redigeres fordi den har status &quot;
            {contract.status}&quot;
          </p>
          <Link href={`/contracts/${contract.id}`}>
            <Button variant="outline" className="mt-4">
              Tilbake til kontrakt
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6 max-w-4xl">
      <div className="mb-6">
        <Link href={`/contracts/${contract.id}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til kontrakt
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Rediger kontrakt</h1>
        <p className="text-muted-foreground mt-1">
          {contract.contract_number} - {contract.title}
        </p>
      </div>

      <ContractForm
        contract={{
          id: contract.id,
          assignment_id: contract.assignment_id,
          organization_id: contract.organization_id,
          candidate_id: contract.candidate_id,
          template_id: contract.template_id,
          type: contract.type,
          title: contract.title,
          description: contract.description,
          content_html: contract.content_html,
          variables: contract.variables,
          effective_date: contract.effective_date,
          expiry_date: contract.expiry_date,
        }}
      />
    </div>
  )
}
