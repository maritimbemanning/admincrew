'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import {
  requestFormSchema,
  defaultRequestValues,
  type RequestFormData,
} from '@/lib/validations/operations'
import {
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  PRIORITY_LEVELS,
  PRIORITY_LABELS,
} from '@/types/operations'
import type { CustomerRequest } from '@/types/operations'

// Common roles
const ROLES = [
  'Kaptein',
  'Overstyrmann',
  'Styrmann',
  'Maskinsjef',
  'Maskinist',
  'Matros',
  'Motormann',
  'Kokk',
  'DP-operatør',
  'ROV-pilot',
  'Dykker',
  'Akvatekniker',
]

// Common certifications
const CERTS = [
  'D1', 'D2', 'D3', 'D4', 'D5', 'D6',
  'STCW', 'DP-BAS', 'DP-ADV', 'DP-FULL',
  'Helse', 'BOSIET', 'HUET', 'ETO',
]

interface RequestFormProps {
  request?: CustomerRequest
  onSubmit: (data: RequestFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function RequestForm({
  request,
  onSubmit,
  onCancel,
  isLoading = false,
}: RequestFormProps) {
  const isEditing = !!request

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestFormSchema) as any,
    defaultValues: request
      ? {
          title: request.title,
          description: request.description,
          role_needed: request.role_needed,
          quantity: request.quantity,
          start_date: request.start_date,
          end_date: request.end_date,
          duration_weeks: request.duration_weeks,
          rotation_pattern: request.rotation_pattern,
          certifications_required: request.certifications_required || [],
          certifications_preferred: request.certifications_preferred || [],
          experience_min_years: request.experience_min_years,
          experience_preferred_years: request.experience_preferred_years,
          languages_required: request.languages_required || [],
          languages_preferred: request.languages_preferred || [],
          location_fylke: request.location_fylke,
          budget_min_daily_nok: request.budget_min_daily_nok,
          budget_max_daily_nok: request.budget_max_daily_nok,
          estimated_value_nok: request.estimated_value_nok,
          organization_id: request.organization_id,
          contact_id: request.contact_id,
          status: request.status,
          priority: request.priority,
          owner_id: request.owner_id,
          owner_name: request.owner_name,
        }
      : defaultRequestValues,
  })

  const handleSubmit = async (data: RequestFormData) => {
    await onSubmit(data)
  }

  const selectedRequiredCerts = form.watch('certifications_required') || []
  const selectedPreferredCerts = form.watch('certifications_preferred') || []

  const toggleRequiredCert = (cert: string) => {
    const current = form.getValues('certifications_required') || []
    if (current.includes(cert)) {
      form.setValue('certifications_required', current.filter((c) => c !== cert))
    } else {
      form.setValue('certifications_required', [...current, cert])
      // Remove from preferred if added to required
      const preferred = form.getValues('certifications_preferred') || []
      form.setValue('certifications_preferred', preferred.filter((c) => c !== cert))
    }
  }

  const togglePreferredCert = (cert: string) => {
    const current = form.getValues('certifications_preferred') || []
    if (current.includes(cert)) {
      form.setValue('certifications_preferred', current.filter((c) => c !== cert))
    } else {
      form.setValue('certifications_preferred', [...current, cert])
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Grunnleggende info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tittel *</FormLabel>
                  <FormControl>
                    <Input placeholder="F.eks. Kaptein til MS Nordlys" {...field} />
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
                      placeholder="Mer info om oppdraget..."
                      rows={3}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role_needed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rolle *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Velg rolle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
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
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Antall</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioritet</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRIORITY_LEVELS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {PRIORITY_LABELS[level]}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REQUEST_STATUSES.slice(0, 6).map((status) => (
                          <SelectItem key={status} value={status}>
                            {REQUEST_STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Datoer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Startdato *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sluttdato</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration_weeks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Varighet (uker)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="4"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : null)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rotation_pattern"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turnus</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="F.eks. 4-4, 2-2"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Krav</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Required Certs */}
            <div>
              <FormLabel>Påkrevde sertifikater</FormLabel>
              <FormDescription className="text-xs mb-2">
                Kandidaten MÅ ha disse
              </FormDescription>
              <div className="flex flex-wrap gap-2">
                {CERTS.map((cert) => (
                  <Badge
                    key={cert}
                    variant={selectedRequiredCerts.includes(cert) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleRequiredCert(cert)}
                  >
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Preferred Certs */}
            <div>
              <FormLabel>Foretrukne sertifikater</FormLabel>
              <FormDescription className="text-xs mb-2">
                Pluss hvis kandidaten har disse
              </FormDescription>
              <div className="flex flex-wrap gap-2">
                {CERTS.filter((c) => !selectedRequiredCerts.includes(c)).map((cert) => (
                  <Badge
                    key={cert}
                    variant={selectedPreferredCerts.includes(cert) ? 'secondary' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => togglePreferredCert(cert)}
                  >
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Experience */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="experience_min_years"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min. erfaring (år)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : null)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience_preferred_years"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Foretrukket erfaring (år)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="5"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : null)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Budget */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Budsjett</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="budget_min_daily_nok"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min. dagrate (NOK)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="3000"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : null)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="budget_max_daily_nok"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maks dagrate (NOK)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="5000"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : null)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="estimated_value_nok"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimert totalverdi (NOK)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="100000"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : null)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            Avbryt
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? 'Lagrer...'
              : isEditing
              ? 'Oppdater request'
              : 'Opprett request'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
