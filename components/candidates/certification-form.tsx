'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { CalendarIcon, Loader2, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Switch } from '@/components/ui/switch'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

import { useAddCertification, useUpdateCertification, useDeleteCertification } from '@/hooks'
import type { CandidateCertification } from '@/types/database.types'
import {
  certificationFormSchema,
  type CertificationFormData,
  defaultCertificationValues,
  CERTIFICATION_CATEGORIES,
  CERTIFICATION_CATEGORY_NAMES,
} from '@/lib/validations/candidate'
import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface CertificationFormDialogProps {
  candidateId: string
  certification?: CandidateCertification | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ═══════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════

export function CertificationFormDialog({
  candidateId,
  certification,
  open,
  onOpenChange,
}: CertificationFormDialogProps) {
  const addCertification = useAddCertification()
  const updateCertification = useUpdateCertification()
  const deleteCertification = useDeleteCertification()

  const isEditMode = !!certification

  const form = useForm<CertificationFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(certificationFormSchema) as any,
    defaultValues: certification
      ? {
          category: certification.category as CertificationFormData['category'],
          code: certification.code,
          name: certification.name,
          issuer: certification.issuer,
          issuer_country: certification.issuer_country,
          certificate_number: certification.certificate_number,
          issue_date: certification.issue_date,
          expiry_date: certification.expiry_date,
          is_permanent: certification.is_permanent,
          notes: certification.notes,
        }
      : defaultCertificationValues,
  })

  const isSubmitting = addCertification.isPending || updateCertification.isPending
  const isDeleting = deleteCertification.isPending
  const isPermanent = form.watch('is_permanent')

  async function onSubmit(data: CertificationFormData) {
    try {
      if (isEditMode && certification) {
        await updateCertification.mutateAsync({
          id: certification.id,
          candidateId,
          data: {
            category: data.category,
            code: data.code,
            name: data.name,
            issuer: data.issuer,
            issuer_country: data.issuer_country,
            certificate_number: data.certificate_number,
            issue_date: data.issue_date,
            expiry_date: data.is_permanent ? null : data.expiry_date,
            is_permanent: data.is_permanent,
            notes: data.notes,
          },
        })
        toast.success('Sertifikat oppdatert')
      } else {
        await addCertification.mutateAsync({
          candidate_id: candidateId,
          category: data.category,
          code: data.code,
          name: data.name,
          issuer: data.issuer || undefined,
          issuer_country: data.issuer_country || undefined,
          certificate_number: data.certificate_number || undefined,
          issue_date: data.issue_date || undefined,
          expiry_date: data.is_permanent ? undefined : data.expiry_date || undefined,
          is_permanent: data.is_permanent,
        })
        toast.success('Sertifikat lagt til')
      }
      onOpenChange(false)
      form.reset(defaultCertificationValues)
    } catch (error) {
      console.error('Error saving certification:', error)
      toast.error('Kunne ikke lagre sertifikat')
    }
  }

  async function handleDelete() {
    if (!certification) return

    try {
      await deleteCertification.mutateAsync({
        id: certification.id,
        candidateId,
      })
      toast.success('Sertifikat slettet')
      onOpenChange(false)
      form.reset(defaultCertificationValues)
    } catch (error) {
      console.error('Error deleting certification:', error)
      toast.error('Kunne ikke slette sertifikat')
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      form.reset(defaultCertificationValues)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Rediger sertifikat' : 'Legg til sertifikat'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Oppdater informasjon om sertifikatet'
              : 'Registrer et nytt sertifikat for kandidaten'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Velg kategori" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CERTIFICATION_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {CERTIFICATION_CATEGORY_NAMES[cat]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Code */}
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode</FormLabel>
                    <FormControl>
                      <Input placeholder="f.eks. D5, STCW" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Navn</FormLabel>
                  <FormControl>
                    <Input placeholder="Sertifikatets fulle navn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Issuer */}
              <FormField
                control={form.control}
                name="issuer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Utsteder</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="f.eks. Sjøfartsdirektoratet"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Issuer Country */}
              <FormField
                control={form.control}
                name="issuer_country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Land</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Velg land" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NO">Norge</SelectItem>
                        <SelectItem value="SE">Sverige</SelectItem>
                        <SelectItem value="DK">Danmark</SelectItem>
                        <SelectItem value="FI">Finland</SelectItem>
                        <SelectItem value="GB">Storbritannia</SelectItem>
                        <SelectItem value="NL">Nederland</SelectItem>
                        <SelectItem value="PH">Filippinene</SelectItem>
                        <SelectItem value="OTHER">Annet</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Certificate Number */}
            <FormField
              control={form.control}
              name="certificate_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sertifikatnummer</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Sertifikatets nummer"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Issue Date */}
              <FormField
                control={form.control}
                name="issue_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Utstedelsesdato</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(new Date(field.value), 'PPP', { locale: nb })
                            ) : (
                              <span>Velg dato</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) =>
                            field.onChange(date ? format(date, 'yyyy-MM-dd') : null)
                          }
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Expiry Date */}
              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Utløpsdato</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                            disabled={isPermanent}
                          >
                            {isPermanent ? (
                              <span>Permanent</span>
                            ) : field.value ? (
                              format(new Date(field.value), 'PPP', { locale: nb })
                            ) : (
                              <span>Velg dato</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) =>
                            field.onChange(date ? format(date, 'yyyy-MM-dd') : null)
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Is Permanent */}
            <FormField
              control={form.control}
              name="is_permanent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Permanent sertifikat</FormLabel>
                    <FormDescription>
                      Sertifikatet har ingen utløpsdato
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notater</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Eventuelle notater om sertifikatet"
                      className="resize-none"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              {isEditMode && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={isDeleting || isSubmitting}
                    >
                      {isDeleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Slett
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Dette vil slette sertifikatet permanent. Denne handlingen kan ikke
                        angres.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Avbryt</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Slett
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Avbryt
              </Button>

              <Button type="submit" disabled={isSubmitting || isDeleting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Oppdater' : 'Legg til'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
