'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Building2, Search, Filter, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDebounce } from '@/hooks/use-debounce'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'

// Mock data for now - will be replaced with real hook
const mockOrganizations = [
  {
    id: '1',
    name: 'Frøy AS',
    org_number: '912345678',
    industry: 'aquaculture',
    customer_type: 'customer',
    pipeline_stage: 'won',
    stats: {
      active_assignments: 3,
      open_requests: 2,
      lifetime_value_nok: 2456000,
    },
  },
  {
    id: '2',
    name: 'Nordlaks AS',
    org_number: '987654321',
    industry: 'aquaculture',
    customer_type: 'customer',
    pipeline_stage: 'won',
    stats: {
      active_assignments: 2,
      open_requests: 1,
      lifetime_value_nok: 1800000,
    },
  },
  {
    id: '3',
    name: 'Offshore Services AS',
    org_number: '555666777',
    industry: 'offshore',
    customer_type: 'prospect',
    pipeline_stage: 'contacted',
    stats: {
      active_assignments: 0,
      open_requests: 0,
      lifetime_value_nok: 0,
    },
  },
]

const industryLabels: Record<string, string> = {
  aquaculture: 'Havbruk',
  offshore: 'Offshore',
  shipping: 'Shipping',
  fishing: 'Fiske',
  maritime_services: 'Maritime tjenester',
}

const customerTypeColors: Record<string, string> = {
  prospect: 'bg-yellow-100 text-yellow-800',
  customer: 'bg-green-100 text-green-800',
  partner: 'bg-blue-100 text-blue-800',
  churned: 'bg-gray-100 text-gray-800',
}

const customerTypeLabels: Record<string, string> = {
  prospect: 'Prospekt',
  customer: 'Kunde',
  partner: 'Partner',
  churned: 'Tapt',
}

export default function OrganizationsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [isLoading] = useState(false)

  const filteredOrgs = mockOrganizations.filter((org) =>
    org.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organisasjoner</h1>
          <p className="text-muted-foreground">
            Administrer kunder og prospekter
          </p>
        </div>
        <Button onClick={() => router.push('/crm/organizations/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Ny organisasjon
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Søk organisasjoner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Organization Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <LoadingSkeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredOrgs.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-12 w-12" />}
          title="Ingen organisasjoner funnet"
          description="Prøv et annet søk eller opprett en ny organisasjon."
          action={{
            label: 'Ny organisasjon',
            onClick: () => router.push('/crm/organizations/new'),
          }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrgs.map((org) => (
            <Card
              key={org.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/crm/organizations/${org.id}`)}
            >
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{org.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {org.org_number}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Rediger</DropdownMenuItem>
                    <DropdownMenuItem>Ny request</DropdownMenuItem>
                    <DropdownMenuItem>Logg aktivitet</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary">
                    {industryLabels[org.industry] || org.industry}
                  </Badge>
                  <Badge className={customerTypeColors[org.customer_type]}>
                    {customerTypeLabels[org.customer_type]}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Aktive oppdrag</p>
                    <p className="font-medium">{org.stats.active_assignments}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Åpne requests</p>
                    <p className="font-medium">{org.stats.open_requests}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Lifetime value</p>
                    <p className="font-medium">
                      {formatCurrency(org.stats.lifetime_value_nok)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
