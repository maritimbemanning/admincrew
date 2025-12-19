'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, TrendingUp, Search, Filter, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDebounce } from '@/hooks/use-debounce'
import { LoadingSkeleton } from '@/components/shared/loading-skeleton'
import { EmptyState } from '@/components/shared/empty-state'

// Mock data - will be replaced with real hook
const mockDeals = [
  {
    id: '1',
    title: 'Rammekontrakt 2025',
    organization_name: 'Frøy AS',
    value_nok: 2500000,
    stage: 'negotiation',
    probability: 75,
    expected_close_date: '2025-01-15',
    owner_name: 'Isak Dalen',
  },
  {
    id: '2',
    title: 'Bemanningsavtale Q1',
    organization_name: 'Nordlaks AS',
    value_nok: 800000,
    stage: 'proposal',
    probability: 50,
    expected_close_date: '2025-02-01',
    owner_name: 'Isak Dalen',
  },
  {
    id: '3',
    title: 'Offshore prosjekt',
    organization_name: 'Offshore Services AS',
    value_nok: 1500000,
    stage: 'qualification',
    probability: 20,
    expected_close_date: '2025-03-15',
    owner_name: 'Tor Faafeng',
  },
]

const stageColors: Record<string, string> = {
  qualification: 'bg-gray-100 text-gray-800',
  needs_analysis: 'bg-blue-100 text-blue-800',
  proposal: 'bg-yellow-100 text-yellow-800',
  negotiation: 'bg-orange-100 text-orange-800',
  closed_won: 'bg-green-100 text-green-800',
  closed_lost: 'bg-red-100 text-red-800',
}

const stageLabels: Record<string, string> = {
  qualification: 'Kvalifisering',
  needs_analysis: 'Behovsanalyse',
  proposal: 'Tilbud sendt',
  negotiation: 'Forhandling',
  closed_won: 'Vunnet',
  closed_lost: 'Tapt',
}

export default function DealsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [isLoading] = useState(false)

  const filteredDeals = mockDeals.filter((deal) =>
    deal.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    deal.organization_name.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const totalValue = mockDeals.reduce((sum, deal) => sum + deal.value_nok, 0)
  const weightedValue = mockDeals.reduce(
    (sum, deal) => sum + (deal.value_nok * deal.probability) / 100,
    0
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deals</h1>
          <p className="text-muted-foreground">
            Salgsmuligheter og pipeline
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Ny deal
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              {mockDeals.length} deals
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vektet verdi</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(weightedValue)}</div>
            <p className="text-xs text-muted-foreground">
              basert på sannsynlighet
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gj.snitt dealstørrelse</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalValue / mockDeals.length)}
            </div>
            <p className="text-xs text-muted-foreground">
              per deal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Søk deals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={() => router.push('/crm/pipeline')}>
          Kanban-visning
        </Button>
      </div>

      {/* Deals List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <LoadingSkeleton key={i} className="h-24" />
          ))}
        </div>
      ) : filteredDeals.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="h-12 w-12" />}
          title="Ingen deals funnet"
          description="Prøv et annet søk eller opprett en ny deal."
          action={{
            label: 'Ny deal',
            onClick: () => {},
          }}
        />
      ) : (
        <div className="space-y-4">
          {filteredDeals.map((deal) => (
            <Card
              key={deal.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{deal.title}</h3>
                    <Badge className={stageColors[deal.stage]}>
                      {stageLabels[deal.stage]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {deal.organization_name} • Eier: {deal.owner_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Forventet lukking: {deal.expected_close_date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{formatCurrency(deal.value_nok)}</p>
                  <p className="text-sm text-muted-foreground">
                    {deal.probability}% sannsynlighet
                  </p>
                  <p className="text-sm font-medium text-primary">
                    Vektet: {formatCurrency((deal.value_nok * deal.probability) / 100)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
