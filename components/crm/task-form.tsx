'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
  taskFormSchema,
  defaultTaskValues,
  type TaskFormData,
} from '@/lib/validations/crm'
import { useCreateCrmTask, useUpdateCrmTask } from '@/hooks/use-crm-tasks'
import type { CrmTask } from '@/types/crm'
import {
  CRM_PRIORITY_LEVELS,
  CRM_PRIORITY_LABELS,
  CRM_TASK_STATUSES,
  CRM_TASK_STATUS_LABELS,
  CRM_TASK_CATEGORIES,
  CRM_TASK_CATEGORY_LABELS,
} from '@/types/crm'
import { toast } from 'sonner'

interface TaskFormProps {
  contactId?: string
  contactName?: string
  task?: CrmTask
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function TaskFormDialog({
  contactId,
  contactName,
  task,
  open,
  onOpenChange,
  onSuccess,
}: TaskFormProps) {
  const createTask = useCreateCrmTask()
  const updateTask = useUpdateCrmTask()
  const isEditing = !!task

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema) as any,
    defaultValues: task
      ? {
          title: task.title,
          description: task.description,
          contact_id: task.contact_id,
          deal_id: task.deal_id,
          due_date: task.due_date?.split('T')[0] || null,
          priority: task.priority || 'normal',
          status: task.status || 'todo',
          category: task.category,
          assigned_to: task.assigned_to,
          owner_name: task.owner_name,
        }
      : {
          ...defaultTaskValues,
          contact_id: contactId || null,
        },
  })

  const handleSubmit = async (data: TaskFormData) => {
    try {
      if (isEditing && task) {
        await updateTask.mutateAsync({
          id: task.id,
          updates: {
            title: data.title,
            description: data.description || null,
            due_date: data.due_date || null,
            priority: data.priority,
            status: data.status,
            category: data.category || null,
            assigned_to: data.assigned_to || null,
            owner_name: data.owner_name || null,
          },
        })
        toast.success('Oppgave oppdatert')
      } else {
        await createTask.mutateAsync({
          title: data.title,
          description: data.description || null,
          contact_id: data.contact_id || null,
          deal_id: data.deal_id || null,
          due_date: data.due_date || null,
          priority: data.priority,
          status: data.status,
          category: data.category || null,
          assigned_to: data.assigned_to || null,
          owner_name: data.owner_name || null,
        })
        toast.success('Oppgave opprettet')
      }

      form.reset({
        ...defaultTaskValues,
        contact_id: contactId || null,
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error saving task:', error)
      toast.error(isEditing ? 'Kunne ikke oppdatere oppgave' : 'Kunne ikke opprette oppgave')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Rediger oppgave' : 'Ny oppgave'}</DialogTitle>
          <DialogDescription>
            {contactName
              ? `${isEditing ? 'Rediger' : 'Opprett'} oppgave for ${contactName}`
              : `${isEditing ? 'Rediger' : 'Opprett ny'} oppgave`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tittel *</FormLabel>
                  <FormControl>
                    <Input placeholder="Hva skal gjøres?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beskrivelse</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Flere detaljer om oppgaven..."
                      rows={3}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Due date and Category */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frist</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
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
                    <FormLabel>Kategori</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Velg kategori" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CRM_TASK_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {CRM_TASK_CATEGORY_LABELS[category]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Priority and Status */}
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
                          <SelectValue placeholder="Velg prioritet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CRM_PRIORITY_LEVELS.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {CRM_PRIORITY_LABELS[priority]}
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
                          <SelectValue placeholder="Velg status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CRM_TASK_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {CRM_TASK_STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Assigned to */}
            <FormField
              control={form.control}
              name="owner_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ansvarlig</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Navn pa ansvarlig person"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Avbryt
              </Button>
              <Button
                type="submit"
                disabled={createTask.isPending || updateTask.isPending}
              >
                {createTask.isPending || updateTask.isPending
                  ? 'Lagrer...'
                  : isEditing
                  ? 'Oppdater oppgave'
                  : 'Opprett oppgave'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
