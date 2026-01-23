'use client'

import { useRouter } from 'next/navigation'
import { useCreateRisk } from '@/hooks/use-qms-risks'
import { RiskForm } from '@/components/qms'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Shield } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NewRiskPage() {
  const router = useRouter()
  const createRisk = useCreateRisk()

  const handleSubmit = async (data: Parameters<typeof createRisk.mutateAsync>[0]) => {
    try {
      const result = await createRisk.mutateAsync(data)
      toast.success('Risiko registrert')
      router.push(`/qms/risks/${result.id}`)
    } catch {
      toast.error('Kunne ikke registrere risiko')
    }
  }

  return (
    <div className="container py-6 max-w-3xl">
      <div className="mb-6">
        <Link href="/qms/risks">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til risikoregister
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Ny risiko</h1>
        <p className="text-muted-foreground mt-1">
          Registrer en ny risiko i risikoregisteret
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risikoinformasjon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RiskForm
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            isSubmitting={createRisk.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
