'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { OrganizationCard, Organization } from './organization-card'
import { EmptyState, ConfirmDialog } from '@/components/shared'
import { Building2 } from 'lucide-react'

interface OrganizationListProps {
  organizations: Organization[]
  onDelete?: (id: string) => Promise<void>
  isLoading?: boolean
}

export function OrganizationList({ 
  organizations, 
  onDelete,
  isLoading 
}: OrganizationListProps) {
  const router = useRouter()
  const [deleteOrg, setDeleteOrg] = React.useState<Organization | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleEdit = (org: Organization) => {
    router.push(`/crm/organizations/${org.id}/edit`)
  }

  const handleDelete = async () => {
    if (!deleteOrg || !onDelete) return
    
    setIsDeleting(true)
    try {
      await onDelete(deleteOrg.id)
      setDeleteOrg(null)
    } finally {
      setIsDeleting(false)
    }
  }

  if (organizations.length === 0 && !isLoading) {
    return (
      <EmptyState
        icon={<Building2 className="h-12 w-12 text-muted-foreground" />}
        title="Ingen organisasjoner"
        description="Du har ikke lagt til noen organisasjoner ennå."
        action={{
          label: 'Legg til organisasjon',
          href: '/crm/organizations/new',
        }}
      />
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {organizations.map((org) => (
          <OrganizationCard
            key={org.id}
            organization={org}
            onEdit={handleEdit}
            onDelete={setDeleteOrg}
          />
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteOrg}
        onOpenChange={(open) => !open && setDeleteOrg(null)}
        title="Slett organisasjon"
        description={`Er du sikker på at du vil slette "${deleteOrg?.name}"? Alle tilknyttede kontakter og aktiviteter vil også bli slettet. Denne handlingen kan ikke angres.`}
        confirmLabel="Slett"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  )
}
