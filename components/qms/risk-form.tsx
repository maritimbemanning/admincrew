'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
import { Risk, RISK_CATEGORY_LABELS, RiskCategory, getRiskLevel, RISK_LEVEL_LABELS, RISK_LEVEL_COLORS } from '@/types/qms'
import { Loader2 } from 'lucide-react'

const riskSchema = z.object({
  title: z.string().min(1, 'Tittel er påkrevd'),
  description: z.string().min(1, 'Beskrivelse er påkrevd'),
  category: z.enum([
    'operational',
    'financial',
    'compliance',
    'safety',
    'environmental',
    'strategic',
    'reputational',
    'other',
  ] as const),
  likelihood: z.coerce.number().min(1).max(5),
  impact: z.coerce.number().min(1).max(5),
  mitigation_strategy: z.string().optional(),
  owner_id: z.string().optional(),
  next_review_date: z.string().optional(),
})

type RiskFormValues = z.infer<typeof riskSchema>

interface RiskFormProps {
  risk?: Risk
  onSubmit: (data: RiskFormValues) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

const LIKELIHOOD_OPTIONS = [
  { value: 1, label: '1 - Svært usannsynlig' },
  { value: 2, label: '2 - Usannsynlig' },
  { value: 3, label: '3 - Mulig' },
  { value: 4, label: '4 - Sannsynlig' },
  { value: 5, label: '5 - Svært sannsynlig' },
]

const IMPACT_OPTIONS = [
  { value: 1, label: '1 - Ubetydelig' },
  { value: 2, label: '2 - Liten' },
  { value: 3, label: '3 - Moderat' },
  { value: 4, label: '4 - Betydelig' },
  { value: 5, label: '5 - Kritisk' },
]

export function RiskForm({ risk, onSubmit, onCancel, isSubmitting }: RiskFormProps) {
  const form = useForm<RiskFormValues>({
    resolver: zodResolver(riskSchema) as never,
    defaultValues: {
      title: risk?.title || '',
      description: risk?.description || '',
      category: risk?.category || 'operational',
      likelihood: risk?.likelihood || 3,
      impact: risk?.impact || 3,
      mitigation_strategy: risk?.mitigation_strategy || '',
      owner_id: risk?.owner_id || '',
      next_review_date: risk?.next_review_date?.split('T')[0] || '',
    },
  })

  const likelihood = form.watch('likelihood')
  const impact = form.watch('impact')
  const calculatedScore = likelihood * impact
  const riskLevel = getRiskLevel(calculatedScore)

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
                <Input placeholder="Kort beskrivelse av risikoen" {...field} />
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
                  placeholder="Detaljert beskrivelse av risikoen, potensielle konsekvenser, etc."
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
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kategori *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg kategori" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(
                    Object.entries(RISK_CATEGORY_LABELS) as [RiskCategory, string][]
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

        {/* Risk Assessment */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <Label className="text-base font-semibold">Risikovurdering</Label>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="likelihood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sannsynlighet *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg sannsynlighet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LIKELIHOOD_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
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
              name="impact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konsekvens *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg konsekvens" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {IMPACT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Calculated risk score */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
            <div>
              <span className="text-sm text-muted-foreground">Kalkulert risikoscore:</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold">{calculatedScore}</span>
                <span className="text-muted-foreground">
                  ({likelihood} × {impact})
                </span>
              </div>
            </div>
            <div
              className={`px-4 py-2 rounded-lg text-white font-medium ${RISK_LEVEL_COLORS[riskLevel]}`}
            >
              {RISK_LEVEL_LABELS[riskLevel]}
            </div>
          </div>
        </div>

        <FormField
          control={form.control}
          name="mitigation_strategy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mitigeringsstrategi</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Beskriv tiltak for å redusere eller eliminere risikoen..."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Hvilke tiltak planlegges eller er iverksatt for å håndtere risikoen?
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
                Når risikoen skal vurderes på nytt
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
            {risk ? 'Lagre endringer' : 'Registrer risiko'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
