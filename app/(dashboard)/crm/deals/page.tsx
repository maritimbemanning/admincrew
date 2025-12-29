'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, DollarSign, TrendingUp, MoreHorizontal, Building2 } from 'lucide-react'
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
  useDealsPipeline, 
  useUpdateDealStage,
  dealStages,
  type Deal,
  type DealStage
} from '@/hooks/use-deals'
import { toast } from 'sonner'

export default function DealsPage() {
  const router = useRouter()
  const { data, isLoading, error } = useDealsPipeline()
  const updateStage = useUpdateDealStage()

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`
    }
    return amount.toString()
  }

  const handleMoveToStage = async (deal: Deal, newStage: DealStage) => {
    try {
      await updateStage.mutateAsync({ id: deal.id, stage: newStage })
      toast.success(`"${deal.title}" flyttet til "${dealStages.find(s => s.value === newStage)?.label}"`)
    } catch (error) {
      toast.error('Kunne ikke flytte deal')
      console.error(error)
    }
  }

  if (isLoading) {
    return <DealsPipelineSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
        <p className="text-destructive">Kunne ikke laste deals</p>
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
          <h1 className="text-2xl font-bold">Deals Pipeline</h1>
          <p className="text-muted-foreground flex items-center gap-4">
            <span>{data.stats.totalDeals} aktive deals</span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Vektet verdi: {formatCurrency(data.stats.weightedValue)} NOK
            </span>
            <span className="text-green-600 font-medium">
              ✓ Vunnet: {formatCurrency(data.stats.wonValue)} NOK
            </span>
          </p>
        </div>
        <Button onClick={() => router.push('/crm/deals/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Ny deal
        </Button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(data.stats.totalValue)}</p>
                <p className="text-sm text-muted-foreground">Total pipeline</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(data.stats.weightedValue)}</p>
                <p className="text-sm text-muted-foreground">Vektet verdi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(data.stats.wonValue)}</p>
                <p className="text-sm text-muted-foreground">Vunnet ({data.stats.wonDeals} deals)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{data.stats.totalDeals}</p>
                <p className="text-sm text-muted-foreground">Aktive deals</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
                <p className="text-xs text-muted-foreground">
                  Vektet: {formatCurrency(column.weightedValue)} ({column.probability}%)
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => router.push(`/crm/deals/new?stage=${column.id}`)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Deal Cards */}
            <div className="space-y-2 flex-1 min-h-[200px] overflow-y-auto">
              {column.deals.map((deal) => (
                <Card
                  key={deal.id}
                  className="cursor-pointer hover:shadow-md transition-shadow bg-white"
                  onClick={() => router.push(`/crm/deals/${deal.id}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{deal.title}</p>
                        {deal.organization && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                            <Building2 className="h-3 w-3" />
                            {deal.organization.name}
                          </p>
                        )}
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
                            router.push(`/crm/deals/${deal.id}`)
                          }}>
                            Se detaljer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                            Flytt til fase
                          </div>
                          {dealStages
                            .filter(s => s.value !== deal.stage)
                            .map(stage => (
                              <DropdownMenuItem 
                                key={stage.value}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleMoveToStage(deal, stage.value)
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
                        {deal.value_nok 
                          ? `${formatCurrency(deal.value_nok)} NOK`
                          : '-'
                        }
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {deal.probability}%
                      </Badge>
                    </div>

                    {deal.expected_close_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Forventet: {new Date(deal.expected_close_date).toLocaleDateString('nb-NO')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}

              {column.deals.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Ingen deals
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
        <span>
          Pipeline: ~{formatCurrency(data.stats.totalValue)} NOK ({data.stats.totalDeals} deals)
        </span>
        <span className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Bruk menyen på kortene for å flytte mellom faser
        </span>
      </div>
    </div>
  )
}

function DealsPipelineSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-8 w-24 mb-1" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-80 rounded-lg bg-muted/50 p-3">
            <Skeleton className="h-5 w-24 mb-1" />
            <Skeleton className="h-4 w-32 mb-3" />
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
