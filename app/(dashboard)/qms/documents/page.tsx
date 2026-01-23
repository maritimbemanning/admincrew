'use client'

import { useState } from 'react'
import { useQmsDocuments, useArchiveQmsDocument, useUpdateQmsDocumentStatus } from '@/hooks/use-qms-documents'
import { DocumentCard } from '@/components/qms'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { QmsDocumentFilters, QMS_DOCUMENT_TYPE_LABELS, QMS_DOCUMENT_STATUS_LABELS, QmsDocumentType, QmsDocumentStatus } from '@/types/qms'
import { Plus, Search, FileText, X } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks/use-debounce'

export default function QmsDocumentsPage() {
  const [filters, setFilters] = useState<QmsDocumentFilters>({})
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [archiveId, setArchiveId] = useState<string | null>(null)

  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, error } = useQmsDocuments({
    filters: { ...filters, search: debouncedSearch },
    page,
    pageSize: 20,
  })

  const archiveDocument = useArchiveQmsDocument()
  const updateStatus = useUpdateQmsDocumentStatus()

  const handleSubmitForApproval = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: 'pending_approval' })
      toast.success('Dokument sendt til godkjenning')
    } catch {
      toast.error('Kunne ikke sende dokument til godkjenning')
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: 'approved' })
      toast.success('Dokument godkjent')
    } catch {
      toast.error('Kunne ikke godkjenne dokument')
    }
  }

  const handleArchive = async () => {
    if (!archiveId) return
    try {
      await archiveDocument.mutateAsync(archiveId)
      toast.success('Dokument arkivert')
      setArchiveId(null)
    } catch {
      toast.error('Kunne ikke arkivere dokument')
    }
  }

  const clearFilters = () => {
    setFilters({})
    setSearch('')
    setPage(1)
  }

  const hasActiveFilters = search || filters.type?.length || filters.status?.length || filters.category

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dokumenter</h1>
          <p className="text-muted-foreground">
            Kvalitetssystemets dokumenter og prosedyrer
          </p>
        </div>
        <Link href="/qms/documents/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nytt dokument
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk etter dokumenter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={filters.type?.[0] || 'all'}
          onValueChange={(value) =>
            setFilters((f) => ({
              ...f,
              type: value === 'all' ? undefined : [value as QmsDocumentType],
            }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Dokumenttype" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle typer</SelectItem>
            {(Object.entries(QMS_DOCUMENT_TYPE_LABELS) as [QmsDocumentType, string][]).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>

        <Select
          value={filters.status?.[0] || 'all'}
          onValueChange={(value) =>
            setFilters((f) => ({
              ...f,
              status: value === 'all' ? undefined : [value as QmsDocumentStatus],
            }))
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle statuser</SelectItem>
            {(Object.entries(QMS_DOCUMENT_STATUS_LABELS) as [QmsDocumentStatus, string][]).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Nullstill
          </Button>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-[180px]" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">Kunne ikke laste dokumenter</p>
        </div>
      ) : data?.documents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-1">Ingen dokumenter</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {hasActiveFilters
              ? 'Ingen dokumenter matcher søket'
              : 'Kom i gang ved å opprette et nytt dokument'}
          </p>
          {!hasActiveFilters && (
            <Link href="/qms/documents/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Opprett dokument
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {data?.documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onSubmit={handleSubmitForApproval}
                onApprove={handleApprove}
                onArchive={setArchiveId}
              />
            ))}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Forrige
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Side {page} av {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
              >
                Neste
              </Button>
            </div>
          )}
        </>
      )}

      {/* Archive confirmation */}
      <AlertDialog open={!!archiveId} onOpenChange={() => setArchiveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arkiver dokument?</AlertDialogTitle>
            <AlertDialogDescription>
              Dokumentet vil bli markert som utgått og fjernet fra aktive dokumenter.
              Denne handlingen kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Arkiver</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
