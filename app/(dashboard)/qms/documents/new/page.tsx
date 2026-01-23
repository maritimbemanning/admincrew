'use client'

import { useRouter } from 'next/navigation'
import { useCreateQmsDocument } from '@/hooks/use-qms-documents'
import { DocumentForm } from '@/components/qms'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function NewQmsDocumentPage() {
  const router = useRouter()
  const createDocument = useCreateQmsDocument()

  const handleSubmit = async (data: Parameters<typeof createDocument.mutateAsync>[0]) => {
    try {
      const result = await createDocument.mutateAsync(data)
      toast.success('Dokument opprettet')
      router.push(`/qms/documents/${result.id}`)
    } catch {
      toast.error('Kunne ikke opprette dokument')
    }
  }

  return (
    <div className="container py-6 max-w-3xl">
      <div className="mb-6">
        <Link href="/qms/documents">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til dokumenter
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Nytt dokument</h1>
        <p className="text-muted-foreground mt-1">
          Opprett et nytt QMS-dokument
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Dokumentinformasjon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentForm
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            isSubmitting={createDocument.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
