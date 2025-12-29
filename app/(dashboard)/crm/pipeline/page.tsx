'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Building2, MoreHorizontal, DollarSign, TrendingUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { 
  useOrganizationsPipeline, 
  useUpdateOrganizationStage,
  pipelineStages,
  type Organization,
  type PipelineStage
} from '@/hooks/use-organizations'
import { toast } from 'sonner'

export default function PipelinePage() {
  const router = useRouter()
  const { data, isLoading, error } = useOrganizationsPipeline()
  const updateStage = useUpdateOrganizationStage()

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`
    }
    return amount.toString()
  }

  const handleMoveToStage = async (org: Organization, newStage: PipelineStage) => {
    try {
      await updateStage.mutateAsync({ id: org.id, stage: newStage })
      toast.success(`${org.name} flyttet til "${pipelineStages.find(s => s.value === newStage)?.label}"`)
    } catch (error) {
      toast.error('Kunne ikke flytte organisasjon')
      console.error(error)
    }
  }

  if (isLoading) {
    return <PipelineSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-destructive">Kunne ikke laste pipeline</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Prøv igjen
        </Button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="flex flex-col gap-6 p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales Pipeline</h1>
          <p className="text-muted-foreground flex items-center gap-4">
            <span>{data.stats.totalOrgs} organisasjoner</span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Total: {formatCurrency(data.stats.totalValue)} NOK
            </span>
            <span className="text-green-600 font-medium">
              ✓ Kunder: {formatCurrency(data.stats.wonValue)} NOK
            </span>
          </p>
        </div>
        <Button onClick={() => router.push('/crm/organizations/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Ny organisasjon
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
        {data.columns.map((column) => (
          <div
            key={column.id}
            className={cn(
              'flex-shrink-0 w-80 rounded-lg p-3 flex flex-col',
              column.bgColor
            )}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className={cn('font-semibold text-sm', column.color)}>
                  {column.label}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {column.count} stk • ~{formatCurrency(column.totalValue)} NOK
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => router.push(`/crm/organizations/new?stage=${column.id}`)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Cards */}
            <div className="space-y-2 flex-1 min-h-[200px] overflow-y-auto">
              {column.organizations.map((org) => (
                <Card
                  key={org.id}
                  className="cursor-pointer hover:shadow-md transition-shadow bg-white"
                  onClick={() => router.push(`/crm/organizations/${org.id}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {org.logo_url ? (
                          <img 
                            src={org.logo_url} 
                            alt={org.name}
                            className="h-8 w-8 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10 flex-shrink-0">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{org.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {org.industry || 'Ingen bransje'}
                            {org.address_city && ` • ${org.address_city}`}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/crm/organizations/${org.id}`)
                          }}>
                            Se detaljer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                            Flytt til fase
                          </div>
                          {pipelineStages
                            .filter(s => s.value !== org.pipeline_stage && s.value !== 'churned')
                            .map(stage => (
                              <DropdownMenuItem 
                                key={stage.value}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMoveToStage(org, stage.value)
                                }}
                              >
                                <span className={cn('w-2 h-2 rounded-full mr-2', stage.bgColor)} />
                                {stage.label}
                              </DropdownMenuItem>
                            ))
                          }
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-semibold text-primary">
                        {org.estimated_annual_value_nok 
                          ? `~${formatCurrency(org.estimated_annual_value_nok)} /år`
                          : '-'
                        }
                      </span>
                      {org.tags && org.tags.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {org.tags[0]}
                        </Badge>
                      )}
                    </div>

                    {org.owner_id && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Eier: {org.owner_id.slice(0, 8)}...
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}

              {column.organizations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Ingen organisasjoner
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
        <span>
          Pipeline: ~{formatCurrency(data.stats.totalValue)} NOK ({data.stats.totalOrgs} organisasjoner)
        </span>
        <span className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Bruk menyen på kortene for å flytte mellom faser
        </span>
      </div>
    </div>
  )
}

function PipelineSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-80 rounded-lg bg-muted/50 p-3">
            <Skeleton className="h-5 w-24 mb-1" />
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
