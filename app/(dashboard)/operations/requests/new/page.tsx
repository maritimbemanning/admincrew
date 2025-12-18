'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RequestForm } from '@/components/operations/request-form'
import { useCreateRequest } from '@/hooks/use-requests'
import { toast } from 'sonner'
import type { RequestFormData } from '@/lib/validations/operations'

export default function NewRequestPage() {
  const router = useRouter()
  const createRequest = useCreateRequest()

  const handleSubmit = async (data: RequestFormData) => {
    try {
      const request = await createRequest.mutateAsync(data as any)
      toast.success('Request opprettet')
      router.push(`/operations/requests/${request.id}`)
    } catch (error) {
      console.error('Failed to create request:', error)
      toast.error('Kunne ikke opprette request')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Ny request</h1>
          <p className="text-muted-foreground">
            Opprett en ny bemanningsforespørsel
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl">
        <RequestForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          isLoading={createRequest.isPending}
        />
      </div>
    </div>
  )
}
