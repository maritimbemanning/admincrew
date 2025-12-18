'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ContactForm } from '@/components/crm/contact-form'
import { useCreateCrmContact } from '@/hooks/use-crm-contacts'
import type { ContactFormData } from '@/lib/validations/crm'
import { toast } from 'sonner'

export default function NewContactPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultStatus = searchParams.get('status') || undefined

  const createContact = useCreateCrmContact()

  const handleSubmit = async (data: ContactFormData) => {
    try {
      const contact = await createContact.mutateAsync({
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
      })

      toast.success('Kontakt opprettet')
      router.push(`/crm/contacts/${contact.id}`)
    } catch (error) {
      console.error('Error creating contact:', error)
      toast.error('Kunne ikke opprette kontakt')
    }
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
            <h1 className="text-2xl font-bold">Ny kontakt</h1>
            <p className="text-sm text-muted-foreground">
              Opprett en ny CRM-kontakt
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-3xl mx-auto">
          <ContactForm
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            isLoading={createContact.isPending}
            defaultStatus={defaultStatus}
          />
        </div>
      </div>
    </div>
  )
}
