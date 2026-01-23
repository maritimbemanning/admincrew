'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
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
import { QmsDocument, QMS_DOCUMENT_TYPE_LABELS, QmsDocumentType } from '@/types/qms'
import { Loader2 } from 'lucide-react'

const documentSchema = z.object({
  type: z.enum([
    'policy',
    'procedure',
    'work_instruction',
    'form',
    'checklist',
    'manual',
    'record',
    'external',
  ] as const),
  title: z.string().min(1, 'Tittel er påkrevd'),
  description: z.string().optional(),
  category: z.string().optional(),
  content_html: z.string().optional(),
  next_review_date: z.string().optional(),
  owner_id: z.string().optional(),
})

type DocumentFormValues = z.infer<typeof documentSchema>

interface DocumentFormProps {
  document?: QmsDocument
  onSubmit: (data: DocumentFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

const CATEGORIES = [
  'Kvalitet',
  'HMS',
  'Miljø',
  'Personal',
  'Drift',
  'IT',
  'Økonomi',
  'Annet',
]

export function DocumentForm({
  document,
  onSubmit,
  onCancel,
  isSubmitting,
}: DocumentFormProps) {
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema) as never,
    defaultValues: {
      type: document?.type || 'procedure',
      title: document?.title || '',
      description: document?.description || '',
      category: document?.category || '',
      content_html: document?.content_html || '',
      next_review_date: document?.next_review_date?.split('T')[0] || '',
      owner_id: document?.owner_id || '',
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dokumenttype *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(
                      Object.entries(QMS_DOCUMENT_TYPE_LABELS) as [
                        QmsDocumentType,
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategori</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg kategori" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tittel *</FormLabel>
              <FormControl>
                <Input placeholder="Dokumenttittel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beskrivelse</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Kort beskrivelse av dokumentet..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content_html"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Innhold</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Dokumentinnhold (støtter HTML)..."
                  rows={10}
                  className="font-mono text-sm"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Du kan bruke HTML for formatering. Alternativt last opp en fil.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="next_review_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Neste gjennomgang</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormDescription>
                Når dokumentet skal gjennomgås neste gang
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Avbryt
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {document ? 'Lagre endringer' : 'Opprett dokument'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
