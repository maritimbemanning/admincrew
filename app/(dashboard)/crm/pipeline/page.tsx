'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Building2, MoreHorizontal, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Pipeline stages as defined in CLAUDE.md
const pipelineStages = [
  { id: 'lead', label: 'Lead', color: 'bg-gray-100' },
  { id: 'contacted', label: 'Kontaktet', color: 'bg-blue-100' },
  { id: 'meeting_scheduled', label: 'Møte booka', color: 'bg-indigo-100' },
  { id: 'proposal_sent', label: 'Tilbud sendt', color: 'bg-yellow-100' },
  { id: 'negotiation', label: 'Forhandling', color: 'bg-orange-100' },
  { id: 'won', label: 'Kunde', color: 'bg-green-100' },
]

// Mock data - will be replaced with real hook
const mockOrganizations = [
  { id: '1', name: 'Alpha AS', stage: 'lead', estimated_value: 500000, industry: 'Havbruk' },
  { id: '2', name: 'Beta AS', stage: 'lead', estimated_value: 300000, industry: 'Offshore' },
  { id: '3', name: 'Delta AS', stage: 'contacted', estimated_value: 200000, industry: 'Shipping' },
  { id: '4', name: 'Epsilon AS', stage: 'contacted', estimated_value: 450000, industry: 'Havbruk' },
  { id: '5', name: 'Gamma AS', stage: 'meeting_scheduled', estimated_value: 1200000, industry: 'Offshore' },
  { id: '6', name: 'Theta AS', stage: 'meeting_scheduled', estimated_value: 600000, industry: 'Havbruk' },
  { id: '7', name: 'Kappa AS', stage: 'proposal_sent', estimated_value: 800000, industry: 'Havbruk' },
  { id: '8', name: 'Frøy AS', stage: 'won', estimated_value: 2400000, industry: 'Havbruk' },
  { id: '9', name: 'Nordlaks AS', stage: 'won', estimated_value: 1800000, industry: 'Havbruk' },
  { id: '10', name: 'Mowi AS', stage: 'won', estimated_value: 3200000, industry: 'Havbruk' },
]

export default function PipelinePage() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState(mockOrganizations)

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`
    }
    return `${(amount / 1000).toFixed(0)}K`
  }

  const getStageOrgs = (stageId: string) => {
    return organizations.filter((org) => org.stage === stageId)
  }

  const getStageTotal = (stageId: string) => {
    return getStageOrgs(stageId).reduce((sum, org) => sum + org.estimated_value, 0)
  }

  const totalPipelineValue = organizations.reduce(
    (sum, org) => sum + org.estimated_value,
    0
  )

  return (
    <div className="flex flex-col gap-6 p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-muted-foreground">
            Organisasjoner etter salgsfase • Total: {formatCurrency(totalPipelineValue)} NOK
          </p>
        </div>
        <Button onClick={() => router.push('/crm/organizations/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Ny organisasjon
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
        {pipelineStages.map((stage) => {
          const stageOrgs = getStageOrgs(stage.id)
          const stageTotal = getStageTotal(stage.id)

          return (
            <div
              key={stage.id}
              className={`flex-shrink-0 w-72 rounded-lg ${stage.color} p-3`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm">{stage.label}</h3>
                  <p className="text-xs text-muted-foreground">
                    {stageOrgs.length} • ~{formatCurrency(stageTotal)}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Cards */}
              <div className="space-y-2 min-h-[200px]">
                {stageOrgs.map((org) => (
                  <Card
                    key={org.id}
                    className="cursor-pointer hover:shadow-md transition-shadow bg-white"
                    onClick={() => router.push(`/crm/organizations/${org.id}`)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{org.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {org.industry}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Se detaljer</DropdownMenuItem>
                            <DropdownMenuItem>Flytt til neste fase</DropdownMenuItem>
                            <DropdownMenuItem>Logg aktivitet</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-semibold text-primary">
                          ~{formatCurrency(org.estimated_value)}
                        </span>
                        {stage.id === 'won' && (
                          <Badge className="bg-green-100 text-green-800 text-xs">🏆</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
        <span>
          TOTALT: ~{formatCurrency(totalPipelineValue)} i pipeline ({organizations.length} organisasjoner)
        </span>
        <span className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Drag & drop for å flytte mellom faser (kommer snart)
        </span>
      </div>
    </div>
  )
}
