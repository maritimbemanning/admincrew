'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CapaAction, CAPA_TYPE_LABELS, CapaType } from '@/types/qms'
import { Loader2 } from 'lucide-react'

const capaSchema = z.object({
  type: z.enum(['corrective', 'preventive'] as const),
  description: z.string().min(1, 'Beskrivelse er påkrevd'),
  due_date: z.string().optional(),
  responsible_id: z.string().optional(),
  effectiveness_note: z.string().optional(),
})

type CapaFormValues = z.infer<typeof capaSchema>

interface CapaFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  capa?: CapaAction
  ncId: string
  onSubmit: (data: CapaFormValues) => Promise<void>
  isSubmitting?: boolean
}

export function CapaFormDialog({
  open,
  onOpenChange,
  capa,
  ncId,
  onSubmit,
  isSubmitting,
}: CapaFormDialogProps) {
  const form = useForm<CapaFormValues>({
    resolver: zodResolver(capaSchema) as never,
    defaultValues: {
      type: capa?.type || 'corrective',
      description: capa?.description || '',
      due_date: capa?.due_date?.split('T')[0] || '',
      responsible_id: capa?.responsible_id || '',
      effectiveness_note: capa?.effectiveness_note || '',
    },
  })

  const handleSubmit = async (data: CapaFormValues) => {
    await onSubmit(data)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {capa ? 'Rediger CAPA-tiltak' : 'Nytt CAPA-tiltak'}
          </DialogTitle>
          <DialogDescription>
            {capa
              ? 'Oppdater detaljer for dette tiltaket'
              : 'Legg til et korrigerende eller forebyggende tiltak'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.entries(CAPA_TYPE_LABELS) as [CapaType, string][]).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Korrigerende tiltak retter opp feilen, forebyggende tiltak hindrer
                    at den oppstår igjen.
                  </FormDescription>
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
                      placeholder="Beskriv tiltaket som skal gjennomføres..."
                      rows={4}
                      {...field}
                    />
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
                  <FormMessage />
                </FormItem>
              )}
            />

            {capa && ['completed', 'verified'].includes(capa.status) && (
              <FormField
                control={form.control}
                name="effectiveness_note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effektivitetsvurdering</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Vurdering av om tiltaket har hatt ønsket effekt..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Fyll ut når tiltaket er verifisert
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Avbryt
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {capa ? 'Lagre' : 'Opprett'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
