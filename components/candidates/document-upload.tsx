'use client'

import { useState, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import {
  CalendarIcon,
  Loader2,
  Upload,
  FileText,
  Trash2,
  Download,
  Eye,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useUploadDocument, useDeleteDocument, useGetDocumentUrl } from '@/hooks'
import type { CandidateDocument, DocumentType } from '@/types/database.types'
import { DOCUMENT_TYPES, DOCUMENT_TYPE_NAMES } from '@/lib/validations/candidate'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

// ═══════════════════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════════════════

const documentFormSchema = z.object({
  type: z.enum(DOCUMENT_TYPES as unknown as [DocumentType, ...DocumentType[]]),
  name: z.string().min(1, 'Navn er påkrevd'),
  description: z.string().optional().nullable(),
  document_number: z.string().optional().nullable(),
  issue_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
})

type DocumentFormData = z.infer<typeof documentFormSchema>

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface DocumentUploadProps {
  candidateId: string
  documents: CandidateDocument[]
}

interface DocumentUploadDialogProps {
  candidateId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Ukjent'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(mimeType: string | null): string {
  if (!mimeType) return 'file'
  if (mimeType.includes('pdf')) return 'pdf'
  if (mimeType.includes('image')) return 'image'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'doc'
  return 'file'
}

// ═══════════════════════════════════════════════════════
// DOCUMENT CARD COMPONENT
// ═══════════════════════════════════════════════════════

interface DocumentCardProps {
  document: CandidateDocument
  candidateId: string
}

function DocumentCard({ document, candidateId }: DocumentCardProps) {
  const deleteDocument = useDeleteDocument()
  const [isLoading, setIsLoading] = useState(false)

  async function handleDownload() {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data } = await supabase.storage
        .from('candidate-documents')
        .createSignedUrl(document.file_path, 3600)

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank')
      }
    } catch (error) {
      console.error('Error downloading document:', error)
      toast.error('Kunne ikke laste ned dokument')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    try {
      await deleteDocument.mutateAsync({
        id: document.id,
        candidateId,
        filePath: document.file_path,
      })
      toast.success('Dokument slettet')
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Kunne ikke slette dokument')
    }
  }

  const isExpired = document.expiry_date && new Date(document.expiry_date) < new Date()
  const isExpiringSoon =
    document.expiry_date &&
    new Date(document.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) &&
    !isExpired

  return (
    <Card className="group relative">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{document.name}</span>
              <Badge variant="secondary" className="shrink-0">
                {DOCUMENT_TYPE_NAMES[document.type]}
              </Badge>
              {isExpired && (
                <Badge variant="destructive" className="shrink-0">
                  Utløpt
                </Badge>
              )}
              {isExpiringSoon && (
                <Badge variant="outline" className="shrink-0 border-yellow-500 text-yellow-600">
                  Utløper snart
                </Badge>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>{document.file_name}</span>
              <span>{formatFileSize(document.file_size)}</span>
              {document.expiry_date && (
                <span>
                  Utløper: {format(new Date(document.expiry_date), 'dd.MM.yyyy')}
                </span>
              )}
            </div>

            {document.description && (
              <p className="mt-1 text-sm text-muted-foreground truncate">
                {document.description}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <span className="sr-only">Handlinger</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownload} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Last ned
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Slett
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Slett dokument?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Er du sikker på at du vil slette &quot;{document.name}&quot;? Denne
                      handlingen kan ikke angres.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Avbryt</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Slett
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════
// DOCUMENT UPLOAD DIALOG
// ═══════════════════════════════════════════════════════

export function DocumentUploadDialog({
  candidateId,
  open,
  onOpenChange,
}: DocumentUploadDialogProps) {
  const uploadDocument = useUploadDocument()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<DocumentFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(documentFormSchema) as any,
    defaultValues: {
      type: 'other',
      name: '',
      description: null,
      document_number: null,
      issue_date: null,
      expiry_date: null,
    },
  })

  const isSubmitting = uploadDocument.isPending

  function handleFileSelect(file: File) {
    setSelectedFile(file)
    // Auto-fill name if empty
    if (!form.getValues('name')) {
      form.setValue('name', file.name.replace(/\.[^/.]+$/, ''))
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  async function onSubmit(data: DocumentFormData) {
    if (!selectedFile) {
      toast.error('Velg en fil å laste opp')
      return
    }

    try {
      await uploadDocument.mutateAsync({
        candidateId,
        file: selectedFile,
        type: data.type,
        name: data.name,
        description: data.description || undefined,
        documentNumber: data.document_number || undefined,
        issueDate: data.issue_date || undefined,
        expiryDate: data.expiry_date || undefined,
      })
      toast.success('Dokument lastet opp')
      handleClose()
    } catch (error) {
      console.error('Error uploading document:', error)
      toast.error('Kunne ikke laste opp dokument')
    }
  }

  function handleClose() {
    setSelectedFile(null)
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Last opp dokument</DialogTitle>
          <DialogDescription>
            Last opp et dokument for kandidaten (CV, sertifikat, etc.)
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* File Drop Zone */}
            <div
              className={cn(
                'relative rounded-lg border-2 border-dashed p-6 transition-colors',
                isDragging && 'border-primary bg-primary/5',
                selectedFile && 'border-green-500 bg-green-50'
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="flex items-center gap-3">
                  <FileText className="h-10 w-10 text-green-600" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Dra og slipp en fil her, eller{' '}
                    <button
                      type="button"
                      className="text-primary underline-offset-4 hover:underline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      velg fil
                    </button>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PDF, Word, bilder opptil 10 MB
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                onChange={handleFileInputChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Document Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Velg type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {DOCUMENT_TYPE_NAMES[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Navn</FormLabel>
                    <FormControl>
                      <Input placeholder="Dokumentnavn" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beskrivelse (valgfritt)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Kort beskrivelse av dokumentet"
                      className="resize-none"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Issue Date */}
              <FormField
                control={form.control}
                name="issue_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Utstedelsesdato</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), 'PPP', { locale: nb })
                            ) : (
                              <span>Velg dato</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) =>
                            field.onChange(date ? format(date, 'yyyy-MM-dd') : null)
                          }
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Expiry Date */}
              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Utløpsdato</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), 'PPP', { locale: nb })
                            ) : (
                              <span>Velg dato</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) =>
                            field.onChange(date ? format(date, 'yyyy-MM-dd') : null)
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Avbryt
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedFile}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Last opp
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════
// MAIN DOCUMENT LIST COMPONENT
// ═══════════════════════════════════════════════════════

export function DocumentList({ candidateId, documents }: DocumentUploadProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  // Group documents by type
  const documentsByType = documents.reduce(
    (acc, doc) => {
      const type = doc.type
      if (!acc[type]) {
        acc[type] = []
      }
      acc[type].push(doc)
      return acc
    },
    {} as Record<DocumentType, CandidateDocument[]>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Dokumenter ({documents.length})</h3>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Last opp
        </Button>
      </div>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">Ingen dokumenter lastet opp ennå</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setUploadDialogOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Last opp dokument
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(documentsByType).map(([type, docs]) => (
            <div key={type}>
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                {DOCUMENT_TYPE_NAMES[type as DocumentType]} ({docs.length})
              </h4>
              <div className="grid gap-2">
                {docs.map((doc) => (
                  <DocumentCard key={doc.id} document={doc} candidateId={candidateId} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <DocumentUploadDialog
        candidateId={candidateId}
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
      />
    </div>
  )
}
