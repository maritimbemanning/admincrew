'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Building2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { toast } from 'sonner'
import { Suspense } from 'react'
import { useCreateOrganization, pipelineStages, industries, type PipelineStage } from '@/hooks/use-organizations'

const organizationSchema = z.object({
  name: z.string().min(2, 'Navn må være minst 2 tegn'),
  org_number: z.string().regex(/^\d{9}$/, 'Org.nr må være 9 siffer').optional().or(z.literal('')),
  industry: z.string().optional(),
  company_size: z.string().optional(),
  customer_type: z.string().optional(),
  pipeline_stage: z.string().optional(),
  website: z.string().url('Ugyldig URL').optional().or(z.literal('')),
  email: z.string().email('Ugyldig e-post').optional().or(z.literal('')),
  phone: z.string().optional(),
  address_street: z.string().optional(),
  address_postal_code: z.string().optional(),
  address_city: z.string().optional(),
  estimated_annual_value_nok: z.number().optional(),
  notes: z.string().optional(),
})

type OrganizationFormValues = z.input<typeof organizationSchema>

function NewOrganizationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultStage = searchParams.get('stage') || 'lead'
  
  const createOrganization = useCreateOrganization()

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      org_number: '',
      industry: '',
      company_size: '',
      customer_type: 'prospect',
      pipeline_stage: defaultStage,
      website: '',
      email: '',
      phone: '',
      address_street: '',
      address_postal_code: '',
      address_city: '',
      notes: '',
    },
  })

  const onSubmit = async (data: OrganizationFormValues) => {
    try {
      const org = await createOrganization.mutateAsync({
        name: data.name,
        org_number: data.org_number || undefined,
        industry: data.industry || undefined,
        company_size: data.company_size || undefined,
        customer_type: data.customer_type || undefined,
        pipeline_stage: (data.pipeline_stage as PipelineStage) || 'lead',
        website: data.website || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address_street: data.address_street || undefined,
        address_postal_code: data.address_postal_code || undefined,
        address_city: data.address_city || undefined,
        estimated_annual_value_nok: data.estimated_annual_value_nok || undefined,
        notes: data.notes || undefined,
      })
      
      toast.success('Organisasjon opprettet')
      router.push(`/crm/organizations/${org.id}`)
    } catch (error) {
      console.error('Error creating organization:', error)
      toast.error('Kunne ikke opprette organisasjon')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Grunnleggende info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Navn *</FormLabel>
                    <FormControl>
                      <Input placeholder="Selskap AS" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="org_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organisasjonsnummer</FormLabel>
                    <FormControl>
                      <Input placeholder="123456789" {...field} />
                    </FormControl>
                    <FormDescription>9 siffer</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bransje</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Velg bransje" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {industries.map((ind) => (
                          <SelectItem key={ind.value} value={ind.value}>
                            {ind.label}
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
                name="company_size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Størrelse</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Velg størrelse" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="solo">Enkeltperson</SelectItem>
                        <SelectItem value="small">Liten (1-10)</SelectItem>
                        <SelectItem value="medium">Medium (11-50)</SelectItem>
                        <SelectItem value="large">Stor (51-200)</SelectItem>
                        <SelectItem value="enterprise">Enterprise (200+)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customer_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kundetype</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Velg type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="prospect">Prospekt</SelectItem>
                          <SelectItem value="customer">Kunde</SelectItem>
                          <SelectItem value="partner">Partner</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pipeline_stage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pipeline-fase</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Velg fase" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {pipelineStages.map((stage) => (
                            <SelectItem key={stage.value} value={stage.value}>
                              {stage.label}
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
                name="estimated_annual_value_nok"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimert årlig verdi (NOK)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="500000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Kontaktinfo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-post</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="post@selskap.no" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input placeholder="+47 00 00 00 00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nettside</FormLabel>
                    <FormControl>
                      <Input placeholder="https://selskap.no" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address_street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input placeholder="Gateadresse 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address_postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postnr</FormLabel>
                      <FormControl>
                        <Input placeholder="0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address_city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sted</FormLabel>
                      <FormControl>
                        <Input placeholder="Oslo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notater</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Interne notater om organisasjonen..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/crm/organizations')}
          >
            Avbryt
          </Button>
          <Button type="submit" disabled={createOrganization.isPending}>
            {createOrganization.isPending ? 'Oppretter...' : 'Opprett organisasjon'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default function NewOrganizationPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/crm/organizations')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Ny organisasjon</h1>
              <p className="text-muted-foreground">
                Opprett en ny kunde eller prospekt
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <Suspense fallback={<div className="p-6">Laster...</div>}>
          <NewOrganizationContent />
        </Suspense>
      </div>
    </div>
  )
}
