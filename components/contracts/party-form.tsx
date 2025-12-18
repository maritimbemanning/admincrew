'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  partyFormSchema,
  PartyFormValues,
  partyFormDefaults,
} from '@/lib/validations/contracts'
import { PARTY_TYPE_LABELS, ContractParty } from '@/types/contracts'
import { useAddParty, useUpdateParty, useRemoveParty } from '@/hooks/use-contracts'
import { toast } from 'sonner'
import { Loader2, Trash2 } from 'lucide-react'

interface PartyFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractId: string
  party?: ContractParty
  existingPartiesCount: number
}

export function PartyFormDialog({
  open,
  onOpenChange,
  contractId,
  party,
  existingPartiesCount,
}: PartyFormDialogProps) {
  const isEditing = !!party
  const addParty = useAddParty()
  const updateParty = useUpdateParty()
  const removeParty = useRemoveParty()

  const form = useForm<PartyFormValues>({
    resolver: zodResolver(partyFormSchema) as never,
    defaultValues: party
      ? {
          party_type: party.party_type,
          name: party.name,
          email: party.email,
          phone: party.phone,
          national_id: party.national_id,
          organization_name: party.organization_name,
          organization_number: party.organization_number,
          signing_order: party.signing_order,
        }
      : {
          ...partyFormDefaults,
          signing_order: existingPartiesCount + 1,
        },
  })

  const onSubmit = async (data: PartyFormValues) => {
    // Convert null to undefined for API compatibility
    const cleanData = {
      ...data,
      phone: data.phone ?? undefined,
      national_id: data.national_id ?? undefined,
      organization_name: data.organization_name ?? undefined,
      organization_number: data.organization_number ?? undefined,
    }

    try {
      if (isEditing) {
        await updateParty.mutateAsync({
          id: party.id,
          contract_id: contractId,
          ...cleanData,
        })
        toast.success('Part oppdatert')
      } else {
        await addParty.mutateAsync({
          contract_id: contractId,
          ...cleanData,
        })
        toast.success('Part lagt til')
      }
      onOpenChange(false)
      form.reset()
    } catch {
      toast.error(isEditing ? 'Kunne ikke oppdatere part' : 'Kunne ikke legge til part')
    }
  }

  const handleDelete = async () => {
    if (!party) return

    try {
      await removeParty.mutateAsync({
        id: party.id,
        contract_id: contractId,
      })
      toast.success('Part fjernet')
      onOpenChange(false)
    } catch {
      toast.error('Kunne ikke fjerne part')
    }
  }

  const isPending = addParty.isPending || updateParty.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Rediger part' : 'Legg til part'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Oppdater informasjon om parten'
              : 'Legg til en ny part som skal signere kontrakten'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="party_type"
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
                        {Object.entries(PARTY_TYPE_LABELS).map(([value, label]) => (
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
                name="signing_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Signeringsrekkefølge</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Hvem skal signere først?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Navn</FormLabel>
                  <FormControl>
                    <Input placeholder="Fullt navn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-post</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="navn@eksempel.no" {...field} />
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
                    <Input
                      placeholder="+47 000 00 000"
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
              name="national_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fødselsnummer</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="11 siffer"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>Påkrevd for BankID-signering</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="organization_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organisasjon</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Firmanavn"
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
                name="organization_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Org.nr</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="9 siffer"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              {isEditing && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={removeParty.isPending}
                >
                  {removeParty.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Fjern
                </Button>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  Avbryt
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? 'Oppdater' : 'Legg til'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
