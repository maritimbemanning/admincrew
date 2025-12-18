'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  contractFormSchema,
  ContractFormValues,
  contractFormDefaults,
} from '@/lib/validations/contracts'
import { CONTRACT_TYPE_LABELS } from '@/types/contracts'
import { useCreateContract, useUpdateContract, useContractTemplates } from '@/hooks/use-contracts'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ContractFormProps {
  contract?: {
    id: string
    assignment_id: string | null
    organization_id: string | null
    candidate_id: string | null
    template_id: string | null
    type: ContractFormValues['type']
    title: string
    description: string | null
    content_html: string | null
    variables: Record<string, unknown>
    effective_date: string | null
    expiry_date: string | null
  }
  assignmentId?: string
  organizationId?: string
  candidateId?: string
  onSuccess?: (contractId: string) => void
}

export function ContractForm({
  contract,
  assignmentId,
  organizationId,
  candidateId,
  onSuccess,
}: ContractFormProps) {
  const router = useRouter()
  const isEditing = !!contract

  const createContract = useCreateContract()
  const updateContract = useUpdateContract()
  const { data: templates, isLoading: templatesLoading } = useContractTemplates()

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema) as never,
    defaultValues: contract
      ? {
          assignment_id: contract.assignment_id,
          organization_id: contract.organization_id,
          candidate_id: contract.candidate_id,
          template_id: contract.template_id,
          type: contract.type,
          title: contract.title,
          description: contract.description,
          content_html: contract.content_html,
          variables: contract.variables || {},
          effective_date: contract.effective_date,
          expiry_date: contract.expiry_date,
        }
      : {
          ...contractFormDefaults,
          assignment_id: assignmentId || null,
          organization_id: organizationId || null,
          candidate_id: candidateId || null,
        },
  })

  const selectedTemplateId = form.watch('template_id')
  const selectedType = form.watch('type')

  // Filter templates by type
  const filteredTemplates = templates?.filter(
    (t: { type: string }) => t.type === selectedType
  )

  // Apply template when selected
  useEffect(() => {
    if (selectedTemplateId && templates) {
      const template = templates.find(
        (t: { id: string }) => t.id === selectedTemplateId
      )
      if (template) {
        form.setValue('content_html', template.content_html)
        form.setValue('title', template.name)
      }
    }
  }, [selectedTemplateId, templates, form])

  const onSubmit = async (data: ContractFormValues) => {
    try {
      if (isEditing) {
        await updateContract.mutateAsync({
          id: contract.id,
          title: data.title,
          description: data.description || undefined,
          content_html: data.content_html || undefined,
          variables: data.variables,
          effective_date: data.effective_date || undefined,
          expiry_date: data.expiry_date || undefined,
        })
        toast.success('Kontrakt oppdatert')
        if (onSuccess) {
          onSuccess(contract.id)
        } else {
          router.push(`/contracts/${contract.id}`)
        }
      } else {
        const result = await createContract.mutateAsync({
          assignment_id: data.assignment_id || undefined,
          organization_id: data.organization_id || undefined,
          candidate_id: data.candidate_id || undefined,
          template_id: data.template_id || undefined,
          type: data.type,
          title: data.title,
          description: data.description || undefined,
          content_html: data.content_html || undefined,
          variables: data.variables,
          effective_date: data.effective_date || undefined,
          expiry_date: data.expiry_date || undefined,
        })
        toast.success('Kontrakt opprettet')
        if (onSuccess) {
          onSuccess(result.id)
        } else {
          router.push(`/contracts/${result.id}`)
        }
      }
    } catch {
      toast.error(isEditing ? 'Kunne ikke oppdatere kontrakt' : 'Kunne ikke opprette kontrakt')
    }
  }

  const isPending = createContract.isPending || updateContract.isPending

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Kontraktinformasjon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type kontrakt</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Velg type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(CONTRACT_TYPE_LABELS).map(([value, label]) => (
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
                name="template_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mal</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                      disabled={templatesLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Velg mal (valgfritt)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredTemplates?.map((template: { id: string; name: string }) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Velg en mal for å fylle ut kontraktinnhold automatisk
                    </FormDescription>
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
                  <FormLabel>Tittel</FormLabel>
                  <FormControl>
                    <Input placeholder="F.eks. Ansettelseskontrakt - Kaptein" {...field} />
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
                      placeholder="Kort beskrivelse av kontrakten..."
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
            <CardTitle>Datoer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="effective_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gyldig fra</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gyldig til</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
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

        <Card>
          <CardHeader>
            <CardTitle>Kontraktinnhold</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="content_html"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Innhold (HTML)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Kontraktens innhold i HTML-format..."
                      className="min-h-[300px] font-mono text-sm"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Bruk variabler som {'{kandidat_navn}'}, {'{start_dato}'}, etc.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Avbryt
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Oppdater kontrakt' : 'Opprett kontrakt'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
