'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Building2, Search, Filter, MoreHorizontal, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDebounce } from '@/hooks/use-debounce'
import { useOrganizations, pipelineStages, industries, type PipelineStage } from '@/hooks/use-organizations'
import { cn } from '@/lib/utils'

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
  const [industryFilter, setIndustryFilter] = useState<string>('')
  const [stageFilter, setStageFilter] = useState<string>('')
  
  const debouncedSearch = useDebounce(search, 300)

  const { data, isLoading, error } = useOrganizations({
    search: debouncedSearch || undefined,
    industry: industryFilter || undefined,
    pipelineStage: stageFilter || undefined,
    limit: 50,
  })

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const clearFilters = () => {
    setSearch('')
    setIndustryFilter('')
    setStageFilter('')
  }

  const hasActiveFilters = !!debouncedSearch || !!industryFilter || !!stageFilter

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
        <p className="text-destructive">Kunne ikke laste organisasjoner</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Prøv igjen
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organisasjoner</h1>
          <p className="text-muted-foreground">
            {data?.count ?? 0} organisasjoner totalt
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push('/crm/pipeline')}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Pipeline
          </Button>
          <Button onClick={() => router.push('/crm/organizations/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Ny organisasjon
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Søk på navn eller org.nr..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={industryFilter} onValueChange={setIndustryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Alle bransjer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Alle bransjer</SelectItem>
            {industries.map((ind) => (
              <SelectItem key={ind.value} value={ind.value}>
                {ind.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Alle faser" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Alle faser</SelectItem>
            {pipelineStages.map((stage) => (
              <SelectItem key={stage.value} value={stage.value}>
                {stage.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Nullstill
          </Button>
        )}
      </div>

      {/* Organization Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-3">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !data || data.organizations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Ingen organisasjoner funnet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {hasActiveFilters
              ? 'Prøv å endre filtrene dine for å se flere resultater.'
              : 'Kom i gang ved å opprette din første organisasjon.'}
          </p>
          <Button onClick={() => router.push('/crm/organizations/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Ny organisasjon
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.organizations.map((org) => {
            const stageInfo = pipelineStages.find(s => s.value === org.pipeline_stage)
            const industryInfo = industries.find(i => i.value === org.industry)

            return (
              <Card
                key={org.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/crm/organizations/${org.id}`)}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    {org.logo_url ? (
                      <img
                        src={org.logo_url}
                        alt={org.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-base">{org.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {org.org_number || 'Ingen org.nr'}
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
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/crm/organizations/${org.id}`)
                      }}>
                        Se detaljer
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/crm/organizations/${org.id}/edit`)
                      }}>
                        Rediger
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/operations/requests/new?org=${org.id}`)
                      }}>
                        Ny forespørsel
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {industryInfo && (
                      <Badge variant="secondary">
                        {industryInfo.label}
                      </Badge>
                    )}
                    {org.customer_type && (
                      <Badge className={customerTypeColors[org.customer_type] || ''}>
                        {customerTypeLabels[org.customer_type] || org.customer_type}
                      </Badge>
                    )}
                    {stageInfo && (
                      <Badge className={cn(stageInfo.bgColor, stageInfo.color, 'text-xs')}>
                        {stageInfo.label}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Estimert årlig</p>
                      <p className="font-medium">
                        {formatCurrency(org.estimated_annual_value_nok)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Lifetime value</p>
                      <p className="font-medium">
                        {formatCurrency(org.lifetime_value_nok)}
                      </p>
                    </div>
                  </div>
                  {org.address_city && (
                    <p className="text-xs text-muted-foreground mt-2">
                      📍 {org.address_city}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
