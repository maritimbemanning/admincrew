'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ContactForm } from '@/components/crm/contact-form'
import { useCrmContact } from '@/hooks/use-crm-contact'
import { useUpdateCrmContact } from '@/hooks/use-crm-contacts'
import type { ContactFormData } from '@/lib/validations/crm'
import { toast } from 'sonner'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditContactPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()

  const { data: contact, isLoading, error } = useCrmContact(id)
  const updateContact = useUpdateCrmContact()

  const handleSubmit = async (data: ContactFormData) => {
    try {
      await updateContact.mutateAsync({
        id,
        updates: {
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          company: data.company || null,
          position: data.position || null,
          title: data.title || null,
          source: data.source || null,
          status: data.status,
          priority: data.priority,
          tags: data.tags,
          notes: data.notes || null,
          pinned_note: data.pinned_note || null,
          linkedin_url: data.linkedin_url || null,
          website: data.website || null,
          org_number: data.org_number || null,
          industry: data.industry || null,
          location: data.location || null,
          address: data.address || null,
          deal_value: data.deal_value || null,
          probability: data.probability || null,
          interest_level: data.interest_level || null,
          next_activity: data.next_activity || null,
          follow_up_date: data.follow_up_date || null,
        },
      })

      toast.success('Kontakt oppdatert')
      router.push(`/crm/contacts/${id}`)
    } catch (error) {
      console.error('Error updating contact:', error)
      toast.error('Kunne ikke oppdatere kontakt')
    }
  }

  if (isLoading) {
    return <EditContactSkeleton />
  }

  if (error || !contact) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-lg font-medium text-destructive">
            Kunne ikke laste kontakt
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {error?.message || 'Kontakten finnes ikke'}
          </p>
          <Button className="mt-4" onClick={() => router.push('/crm/contacts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til kontakter
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Rediger kontakt</h1>
            <p className="text-sm text-muted-foreground">{contact.name}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-3xl mx-auto">
          <ContactForm
            contact={contact}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            isLoading={updateContact.isPending}
          />
        </div>
      </div>
    </div>
  )
}

function EditContactSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="border-b p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
      </div>
      <div className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
