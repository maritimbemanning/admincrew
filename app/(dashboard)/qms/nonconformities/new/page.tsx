'use client'

import { useRouter } from 'next/navigation'
import { useCreateNonconformity } from '@/hooks/use-qms-nc'
import { NcForm } from '@/components/qms'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NewNonconformityPage() {
  const router = useRouter()
  const createNc = useCreateNonconformity()

  const handleSubmit = async (data: Parameters<typeof createNc.mutateAsync>[0]) => {
    try {
      const result = await createNc.mutateAsync(data)
      toast.success('Avvik registrert')
      router.push(`/qms/nonconformities/${result.id}`)
    } catch {
      toast.error('Kunne ikke registrere avvik')
    }
  }

  return (
    <div className="container py-6 max-w-3xl">
      <div className="mb-6">
        <Link href="/qms/nonconformities">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til avvik
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Registrer avvik</h1>
        <p className="text-muted-foreground mt-1">
          Registrer et nytt avvik i kvalitetssystemet
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Avviksinformasjon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NcForm
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            isSubmitting={createNc.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
