'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { 
  Clock, 
  Coffee, 
  Moon, 
  Trash2,
  Save,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const entryFormSchema = z.object({
  date: z.string(),
  start_time: z.string().min(1, 'Påkrevd'),
  end_time: z.string().min(1, 'Påkrevd'),
  break_minutes: z.number().min(0).max(480),
  work_type: z.enum(['normal', 'overtime', 'holiday', 'sick', 'vacation']),
  description: z.string().optional(),
})

type EntryFormValues = z.infer<typeof entryFormSchema>

interface TimesheetEntryProps {
  date: Date
  assignment?: {
    id: string
    role: string
    organization: string
  }
  initialValues?: Partial<EntryFormValues>
  onSave: (data: EntryFormValues) => Promise<void>
  onDelete?: () => Promise<void>
  disabled?: boolean
  className?: string
}

const workTypes = [
  { value: 'normal', label: 'Normal', icon: Clock },
  { value: 'overtime', label: 'Overtid', icon: Moon },
  { value: 'holiday', label: 'Helligdag', icon: Coffee },
  { value: 'sick', label: 'Syk', icon: Coffee },
  { value: 'vacation', label: 'Ferie', icon: Coffee },
]

export function TimesheetEntry({
  date,
  assignment,
  initialValues,
  onSave,
  onDelete,
  disabled = false,
  className,
}: TimesheetEntryProps) {
  const [isSaving, setIsSaving] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const form = useForm<EntryFormValues>({
    resolver: zodResolver(entryFormSchema),
    defaultValues: {
      date: date.toISOString().split('T')[0],
      start_time: initialValues?.start_time || '08:00',
      end_time: initialValues?.end_time || '16:00',
      break_minutes: initialValues?.break_minutes ?? 30,
      work_type: initialValues?.work_type || 'normal',
      description: initialValues?.description || '',
    },
  })

  const startTime = form.watch('start_time')
  const endTime = form.watch('end_time')
  const breakMinutes = form.watch('break_minutes')

  // Calculate total hours
  const calculateHours = () => {
    if (!startTime || !endTime) return 0
    
    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)
    
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    
    const totalMinutes = endMinutes - startMinutes - breakMinutes
    return Math.max(0, totalMinutes / 60)
  }

  const totalHours = calculateHours()

  const handleSubmit = async (data: EntryFormValues) => {
    setIsSaving(true)
    try {
      await onSave(data)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete()
    } finally {
      setIsDeleting(false)
    }
  }

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('nb-NO', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  }

  return (
    <div className={cn(
      'p-4 border rounded-lg bg-card',
      disabled && 'opacity-60 pointer-events-none',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-medium capitalize">{formatDate(date)}</p>
          {assignment && (
            <p className="text-sm text-muted-foreground">
              {assignment.role} • {assignment.organization}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">timer</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {/* Start time */}
            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Start</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} className="h-9" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* End time */}
            <FormField
              control={form.control}
              name="end_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Slutt</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} className="h-9" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Break */}
            <FormField
              control={form.control}
              name="break_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Pause (min)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={0}
                      max={480}
                      {...field} 
                      className="h-9" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Work type */}
          <FormField
            control={form.control}
            name="work_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {workTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-3 w-3" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <FormLabel className="text-xs">Merknad (valgfritt)</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    rows={2}
                    placeholder="Legg til en beskrivelse..."
                    className="resize-none text-sm"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {isDeleting ? 'Sletter...' : 'Slett'}
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="ml-auto"
            >
              <Save className="h-4 w-4 mr-1" />
              {isSaving ? 'Lagrer...' : 'Lagre'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

/**
 * Compact version of timesheet entry for grid view
 */
interface TimesheetEntryCompactProps {
  date: Date
  hours?: number
  type?: 'normal' | 'overtime' | 'holiday' | 'sick' | 'vacation'
  onClick?: () => void
  isSelected?: boolean
  disabled?: boolean
}

export function TimesheetEntryCompact({
  date,
  hours = 0,
  type = 'normal',
  onClick,
  isSelected,
  disabled,
}: TimesheetEntryCompactProps) {
  const getBgColor = () => {
    if (disabled) return 'bg-muted'
    if (hours === 0) return 'bg-transparent border-dashed'
    
    switch (type) {
      case 'overtime': return 'bg-orange-100 border-orange-300'
      case 'holiday': return 'bg-blue-100 border-blue-300'
      case 'sick': return 'bg-red-100 border-red-300'
      case 'vacation': return 'bg-green-100 border-green-300'
      default: return 'bg-primary/10 border-primary/30'
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full h-16 p-1 rounded border transition-colors',
        getBgColor(),
        isSelected && 'ring-2 ring-primary',
        !disabled && hours === 0 && 'hover:bg-muted/50',
        !disabled && hours > 0 && 'hover:opacity-80',
        disabled && 'cursor-not-allowed'
      )}
    >
      <div className="text-xs text-muted-foreground">
        {date.getDate()}
      </div>
      {hours > 0 && (
        <div className="text-sm font-medium mt-1">
          {hours.toFixed(1)}t
        </div>
      )}
    </button>
  )
}
