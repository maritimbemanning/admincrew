'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { useCreateCandidate, useUpdateCandidate } from '@/hooks'
import type { TablesInsert } from '@/types/database.types'
import {
  candidateFormSchema,
  type CandidateFormData,
  defaultCandidateValues,
  PRIMARY_ROLES,
  ROLE_DISPLAY_NAMES,
  SECTORS,
  SECTOR_DISPLAY_NAMES,
  AVAILABILITY_STATUSES,
  COMPLIANCE_STATUSES,
  LANGUAGES,
  LANGUAGE_LEVELS,
} from '@/lib/validations/candidate'

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface CandidateFormProps {
  mode: 'create' | 'edit'
  candidateId?: string
  initialData?: Partial<CandidateFormData>
}

// ═══════════════════════════════════════════════════════
// DISPLAY HELPERS
// ═══════════════════════════════════════════════════════

const AVAILABILITY_DISPLAY: Record<string, string> = {
  available: 'Tilgjengelig',
  available_soon: 'Snart tilgjengelig',
  on_assignment: 'På oppdrag',
  unavailable: 'Utilgjengelig',
  inactive: 'Inaktiv',
}

const COMPLIANCE_DISPLAY: Record<string, string> = {
  not_started: 'Ikke startet',
  documents_pending: 'Dokumenter mangler',
  review_pending: 'Venter på godkjenning',
  approved: 'Godkjent',
  expired: 'Utløpt',
  rejected: 'Avvist',
}

// ═══════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════

export function CandidateForm({ mode, candidateId, initialData }: CandidateFormProps) {
  const router = useRouter()
  const createCandidate = useCreateCandidate()
  const updateCandidate = useUpdateCandidate()

  const form = useForm<CandidateFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(candidateFormSchema) as any,
    defaultValues: {
      ...defaultCandidateValues,
      ...initialData,
    },
  })

  const isSubmitting = createCandidate.isPending || updateCandidate.isPending

  async function onSubmit(data: CandidateFormData) {
    try {
      // Transform form data to database format (migration 00003_candidates.sql)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dbData: any = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        mobile: data.mobile,
        date_of_birth: data.date_of_birth,
        nationality: data.nationality,
        // Location - map form fields to DB columns
        address_city: data.city,
        address_country: data.country,
        // Professional
        primary_role: data.primary_role,
        secondary_roles: data.secondary_roles,
        experience_years: data.experience_years,
        sectors: data.sectors,
        cv_summary: data.cv_summary,
        languages: data.languages,
        // Availability
        availability_status: data.availability_status,
        availability_date: data.availability_date,
        // Rate
        expected_daily_rate: data.expected_daily_rate,
        currency: data.currency,
        // Internal
        internal_rating: data.internal_rating,
        internal_notes: data.internal_notes,
        tags: data.tags,
        // Compliance
        compliance_status: data.compliance_status,
        flagged_reason: data.flagged_reason,
      }

      if (mode === 'create') {
        const created = await createCandidate.mutateAsync(dbData)
        toast.success('Kandidat opprettet')
        router.push(`/candidates/${created.id}`)
      } else if (candidateId) {
        await updateCandidate.mutateAsync({ id: candidateId, data: dbData })
        toast.success('Kandidat oppdatert')
        router.push(`/candidates/${candidateId}`)
      }
    } catch (error) {
      console.error('Error saving candidate:', error)
      toast.error(mode === 'create' ? 'Kunne ikke opprette kandidat' : 'Kunne ikke oppdatere kandidat')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={candidateId ? `/candidates/${candidateId}` : '/candidates'}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {mode === 'create' ? 'Ny kandidat' : 'Rediger kandidat'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {mode === 'create'
                  ? 'Fyll ut informasjon om den nye kandidaten'
                  : 'Oppdater kandidatens informasjon'}
              </p>
            </div>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Lagrer...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {mode === 'create' ? 'Opprett kandidat' : 'Lagre endringer'}
              </>
            )}
          </Button>
        </div>

        {/* Main content */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal">Personalia</TabsTrigger>
            <TabsTrigger value="professional">Profesjonell</TabsTrigger>
            <TabsTrigger value="availability">Tilgjengelighet</TabsTrigger>
            <TabsTrigger value="preferences">Kompensasjon</TabsTrigger>
            <TabsTrigger value="internal">Intern</TabsTrigger>
          </TabsList>

          {/* Personal Info Tab */}
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personlig informasjon</CardTitle>
                <CardDescription>Grunnleggende kontaktinformasjon</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fornavn *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ola" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Etternavn *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nordmann" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-post *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="ola@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon</FormLabel>
                        <FormControl>
                          <Input placeholder="+47 900 00 000" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mobil</FormLabel>
                        <FormControl>
                          <Input placeholder="+47 900 00 001" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fødselsdato</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nasjonalitet</FormLabel>
                        <FormControl>
                          <Input placeholder="NO" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lokasjon</CardTitle>
                <CardDescription>Bosted og geografisk plassering</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>By</FormLabel>
                        <FormControl>
                          <Input placeholder="Oslo" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Land</FormLabel>
                        <FormControl>
                          <Input placeholder="NO" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Professional Info Tab */}
          <TabsContent value="professional" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Roller og erfaring</CardTitle>
                <CardDescription>Profesjonell bakgrunn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="primary_role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primærrolle *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Velg rolle" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRIMARY_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {ROLE_DISPLAY_NAMES[role] || role}
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
                  name="secondary_roles"
                  render={() => (
                    <FormItem>
                      <FormLabel>Sekundærroller</FormLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {PRIMARY_ROLES.map((role) => (
                          <FormField
                            key={role}
                            control={form.control}
                            name="secondary_roles"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(role)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || []
                                      if (checked) {
                                        field.onChange([...current, role])
                                      } else {
                                        field.onChange(current.filter((r) => r !== role))
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {ROLE_DISPLAY_NAMES[role] || role}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="experience_years"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>År med erfaring</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sectors"
                  render={() => (
                    <FormItem>
                      <FormLabel>Sektorer</FormLabel>
                      <div className="flex flex-wrap gap-4">
                        {SECTORS.map((sector) => (
                          <FormField
                            key={sector}
                            control={form.control}
                            name="sectors"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(sector)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || []
                                      if (checked) {
                                        field.onChange([...current, sector])
                                      } else {
                                        field.onChange(current.filter((s) => s !== sector))
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal">
                                  {SECTOR_DISPLAY_NAMES[sector] || sector}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cv_summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CV-sammendrag</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Kort oppsummering av erfaring og kompetanse..."
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Skriv en kort oppsummering av kandidatens erfaring
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Availability Tab */}
          <TabsContent value="availability" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tilgjengelighet</CardTitle>
                <CardDescription>Status og tilgjengelighet for oppdrag</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="availability_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Velg status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {AVAILABILITY_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {AVAILABILITY_DISPLAY[status] || status}
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
                  name="availability_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tilgjengelig fra</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        Dato kandidaten er tilgjengelig for nye oppdrag
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="available_until"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tilgjengelig til</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        Sluttdato for tilgjengelighetsperioden
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kompensasjon</CardTitle>
                <CardDescription>Forventet dagrate og kontraktlengde</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="expected_daily_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Forventet dagrate</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="2500"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valuta</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || 'NOK'}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Velg valuta" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="NOK">NOK</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="preferred_contract_length_months"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foretrukket kontraktlengde (måneder)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="24"
                          placeholder="6"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormDescription>
                        Foretrukket lengde på kontrakt i måneder
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Internal Tab */}
          <TabsContent value="internal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Intern vurdering</CardTitle>
                <CardDescription>Kun synlig for ansatte</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="internal_rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating (1-5)</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(val ? Number(val) : null)}
                        value={field.value?.toString() || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Velg rating" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">⭐ 1 - Dårlig</SelectItem>
                          <SelectItem value="2">⭐⭐ 2 - Under middels</SelectItem>
                          <SelectItem value="3">⭐⭐⭐ 3 - Middels</SelectItem>
                          <SelectItem value="4">⭐⭐⭐⭐ 4 - God</SelectItem>
                          <SelectItem value="5">⭐⭐⭐⭐⭐ 5 - Utmerket</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="internal_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interne notater</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Notater om kandidaten (kun synlig internt)..."
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance</CardTitle>
                <CardDescription>Compliance-status for kandidaten</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="compliance_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compliance-status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Velg status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COMPLIANCE_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {COMPLIANCE_DISPLAY[status] || status}
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
                  name="flagged_reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Merknad/årsak</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Eventuell merknad eller årsak til flagging..."
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom save button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Lagrer...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {mode === 'create' ? 'Opprett kandidat' : 'Lagre endringer'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

// Loading skeleton for the form
export function CandidateFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </div>
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  )
}
