'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Users, Plus, Loader2, FolderPlus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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

const poolFormSchema = z.object({
  name: z.string().min(2, 'Navn må være minst 2 tegn').max(100, 'Navn kan ikke være mer enn 100 tegn'),
  description: z.string().max(500, 'Beskrivelse kan ikke være mer enn 500 tegn').optional(),
  type: z.enum(['static', 'dynamic'], {
    message: 'Velg en type',
  }),
  filterCriteria: z.string().optional(),
})

type PoolFormValues = z.infer<typeof poolFormSchema>

interface PoolCreateDialogProps {
  onSubmit: (data: PoolFormValues) => Promise<void>
  trigger?: React.ReactNode
}

export function PoolCreateDialog({ onSubmit, trigger }: PoolCreateDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<PoolFormValues>({
    resolver: zodResolver(poolFormSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'static',
      filterCriteria: '',
    },
  })

  const watchType = form.watch('type')

  const handleSubmit = async (data: PoolFormValues) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      setOpen(false)
      form.reset()
    } catch (error) {
      console.error('Failed to create pool:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <FolderPlus className="mr-2 h-4 w-4" />
            Ny pool
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Opprett ny pool
          </DialogTitle>
          <DialogDescription>
            Opprett en ny kandidatpool for å organisere og gruppere kandidater.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Navn</FormLabel>
                  <FormControl>
                    <Input placeholder="F.eks. Senior utviklere" {...field} />
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
                      placeholder="Beskriv formålet med denne poolen..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="static">
                        Statisk (manuelt vedlikeholdt)
                      </SelectItem>
                      <SelectItem value="dynamic">
                        Dynamisk (automatisk basert på kriterier)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {watchType === 'static' 
                      ? 'Kandidater legges til og fjernes manuelt.'
                      : 'Kandidater inkluderes automatisk basert på filterkriterier.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchType === 'dynamic' && (
              <FormField
                control={form.control}
                name="filterCriteria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Filterkriterier</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="skills:JavaScript,TypeScript; status:available; experience:5+"
                        className="resize-none font-mono text-sm"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Definer kriterier for automatisk inkludering av kandidater.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Avbryt
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Oppretter...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Opprett pool
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
