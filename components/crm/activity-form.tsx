'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Phone, Mail, Calendar as CalendarIcon, FileText, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  activityFormSchema,
  defaultActivityValues,
  type ActivityFormData,
} from '@/lib/validations/crm'
import { useCreateCrmActivity } from '@/hooks/use-crm-activities'
import {
  CRM_ACTIVITY_TYPES,
  CRM_ACTIVITY_TYPE_LABELS,
  CRM_ACTIVITY_TYPE_ICONS,
  CRM_CALL_OUTCOMES,
  CRM_CALL_OUTCOME_LABELS,
} from '@/types/crm'
import { toast } from 'sonner'

interface ActivityFormProps {
  contactId: string
  contactName?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ActivityFormDialog({
  contactId,
  contactName,
  open,
  onOpenChange,
  onSuccess,
}: ActivityFormProps) {
  const createActivity = useCreateCrmActivity()

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormSchema) as any,
    defaultValues: {
      ...defaultActivityValues,
      contact_id: contactId,
      date: new Date().toISOString(),
    },
  })

  const activityType = form.watch('type')

  const handleSubmit = async (data: ActivityFormData) => {
    try {
      await createActivity.mutateAsync({
        contact_id: data.contact_id,
        type: data.type,
        subject: data.subject || null,
        description: data.description || null,
        date: data.date,
        call_duration_minutes: data.call_duration_minutes || null,
        call_outcome: data.call_outcome || null,
        meeting_location: data.meeting_location || null,
        meeting_attendees: data.meeting_attendees || null,
        email_from: data.email_from || null,
        email_to: data.email_to || null,
        email_cc: data.email_cc || null,
        next_activity: data.next_activity || null,
        next_follow_up_date: data.next_follow_up_date || null,
        created_by_name: data.created_by_name || null,
      })

      toast.success('Aktivitet registrert')
      form.reset({
        ...defaultActivityValues,
        contact_id: contactId,
        date: new Date().toISOString(),
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error creating activity:', error)
      toast.error('Kunne ikke registrere aktivitet')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Logg aktivitet</DialogTitle>
          <DialogDescription>
            {contactName ? `Registrer aktivitet for ${contactName}` : 'Registrer ny aktivitet'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Activity Type Tabs */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <Tabs value={field.value} onValueChange={field.onChange}>
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="call" className="gap-1">
                        <Phone className="h-4 w-4" />
                        <span className="hidden sm:inline">Samtale</span>
                      </TabsTrigger>
                      <TabsTrigger value="email" className="gap-1">
                        <Mail className="h-4 w-4" />
                        <span className="hidden sm:inline">E-post</span>
                      </TabsTrigger>
                      <TabsTrigger value="meeting" className="gap-1">
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">Mote</span>
                      </TabsTrigger>
                      <TabsTrigger value="note" className="gap-1">
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Notat</span>
                      </TabsTrigger>
                      <TabsTrigger value="proposal" className="gap-1">
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Tilbud</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </FormItem>
              )}
            />

            {/* Subject */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emne</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        activityType === 'call'
                          ? 'F.eks. Oppfølging av tilbud'
                          : activityType === 'meeting'
                          ? 'F.eks. Innledende møte'
                          : 'Kort beskrivelse'
                      }
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Call-specific fields */}
            {activityType === 'call' && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="call_duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Varighet (min)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="15"
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
                  name="call_outcome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resultat</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Velg resultat" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CRM_CALL_OUTCOMES.map((outcome) => (
                            <SelectItem key={outcome} value={outcome}>
                              {CRM_CALL_OUTCOME_LABELS[outcome]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Meeting-specific fields */}
            {activityType === 'meeting' && (
              <FormField
                control={form.control}
                name="meeting_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sted</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="F.eks. Teams, Kontoret, Restauranten"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detaljer</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Hva ble diskutert? Viktige punkter..."
                      rows={3}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Follow-up */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="next_activity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Neste steg</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="F.eks. Sende tilbud"
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
                name="next_follow_up_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Oppfolging dato</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Avbryt
              </Button>
              <Button type="submit" disabled={createActivity.isPending}>
                {createActivity.isPending ? 'Lagrer...' : 'Registrer aktivitet'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
