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
import {
  Nonconformity,
  NC_SOURCE_LABELS,
  NC_SEVERITY_LABELS,
  NcSource,
  NcSeverity,
} from '@/types/qms'
import { Loader2 } from 'lucide-react'

const ncSchema = z.object({
  title: z.string().min(1, 'Tittel er påkrevd'),
  description: z.string().min(1, 'Beskrivelse er påkrevd'),
  source: z.enum([
    'internal_audit',
    'external_audit',
    'customer_complaint',
    'supplier_issue',
    'incident',
    'observation',
    'other',
  ] as const),
  severity: z.enum(['minor', 'major', 'critical'] as const),
  category: z.string().optional(),
  location: z.string().optional(),
  due_date: z.string().optional(),
  responsible_id: z.string().optional(),
  detected_at: z.string().optional(),
  root_cause: z.string().optional(),
  immediate_action: z.string().optional(),
})

type NcFormValues = z.infer<typeof ncSchema>

interface NcFormProps {
  nc?: Nonconformity
  onSubmit: (data: NcFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

const CATEGORIES = [
  'Prosess',
  'Dokumentasjon',
  'Utstyr',
  'Personal',
  'HMS',
  'Miljø',
  'Leverandør',
  'Kunde',
  'Annet',
]

export function NcForm({ nc, onSubmit, onCancel, isSubmitting }: NcFormProps) {
  const form = useForm<NcFormValues>({
    resolver: zodResolver(ncSchema) as never,
    defaultValues: {
      title: nc?.title || '',
      description: nc?.description || '',
      source: nc?.source || 'observation',
      severity: nc?.severity || 'minor',
      category: nc?.category || '',
      location: nc?.location || '',
      due_date: nc?.due_date?.split('T')[0] || '',
      responsible_id: nc?.responsible_id || '',
      detected_at: nc?.detected_at?.split('T')[0] || '',
      root_cause: nc?.root_cause || '',
      immediate_action: nc?.immediate_action || '',
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tittel *</FormLabel>
              <FormControl>
                <Input placeholder="Kort beskrivelse av avviket" {...field} />
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
              <FormLabel>Beskrivelse *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detaljert beskrivelse av avviket, hva som ble observert, når det skjedde, etc."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kilde *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg kilde" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.entries(NC_SOURCE_LABELS) as [NcSource, string][]).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="severity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alvorlighetsgrad *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Velg alvorlighetsgrad" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(
                      Object.entries(NC_SEVERITY_LABELS) as [NcSeverity, string][]
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
        </div>

        <div className="grid grid-cols-2 gap-4">
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

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sted</FormLabel>
                <FormControl>
                  <Input placeholder="Hvor avviket ble oppdaget" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="detected_at"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Oppdaget dato</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frist</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormDescription>Frist for lukking av avviket</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="immediate_action"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Umiddelbar handling</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Beskriv eventuelle umiddelbare tiltak som er iverksatt..."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {nc && (
          <FormField
            control={form.control}
            name="root_cause"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rotårsak</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Identifisert rotårsak til avviket..."
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Avbryt
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {nc ? 'Lagre endringer' : 'Registrer avvik'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
