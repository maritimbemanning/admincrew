'use client'

import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  MoreHorizontal,
  Building2,
  Calendar,
  DollarSign,
  User,
  ArrowRight,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DealCardProps {
  deal: {
    id: string
    title: string
    value: number
    currency?: string
    stage: string
    probability?: number
    expected_close?: string
    organization?: {
      id: string
      name: string
    }
    contact?: {
      id: string
      name: string
    }
    owner?: {
      id: string
      name: string
    }
    created_at: string
    updated_at: string
  }
  variant?: 'default' | 'compact' | 'kanban'
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onStageChange?: (id: string, stage: string) => void
  onClick?: (id: string) => void
  className?: string
}

const stageConfig: Record<string, { label: string; color: string }> = {
  lead: { label: 'Lead', color: 'bg-gray-100 text-gray-800' },
  qualified: { label: 'Kvalifisert', color: 'bg-blue-100 text-blue-800' },
  proposal: { label: 'Tilbud', color: 'bg-purple-100 text-purple-800' },
  negotiation: { label: 'Forhandling', color: 'bg-yellow-100 text-yellow-800' },
  closed_won: { label: 'Vunnet', color: 'bg-green-100 text-green-800' },
  closed_lost: { label: 'Tapt', color: 'bg-red-100 text-red-800' },
}

const formatCurrency = (value: number, currency = 'NOK') => {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function DealCard({
  deal,
  variant = 'default',
  onEdit,
  onDelete,
  onStageChange,
  onClick,
  className,
}: DealCardProps) {
  const stageInfo = stageConfig[deal.stage] || { label: deal.stage, color: 'bg-gray-100 text-gray-800' }
  const isClosed = deal.stage.startsWith('closed_')

  if (variant === 'kanban') {
    return (
      <Card 
        className={cn(
          'cursor-pointer hover:shadow-md transition-shadow',
          className
        )}
        onClick={() => onClick?.(deal.id)}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between">
            <p className="font-medium text-sm line-clamp-2">{deal.title}</p>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            <span className="font-medium text-foreground">
              {formatCurrency(deal.value, deal.currency)}
            </span>
          </div>

          {deal.organization && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{deal.organization.name}</span>
            </div>
          )}

          {deal.expected_close && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {format(new Date(deal.expected_close), 'd. MMM', { locale: nb })}
              </span>
            </div>
          )}

          {deal.owner && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px]">
                  {deal.owner.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{deal.owner.name}</span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (variant === 'compact') {
    return (
      <div 
        className={cn(
          'flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 cursor-pointer',
          className
        )}
        onClick={() => onClick?.(deal.id)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{deal.title}</p>
            <Badge className={stageInfo.color}>{stageInfo.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {deal.organization?.name}
          </p>
        </div>
        <div className="text-right">
          <p className="font-medium">{formatCurrency(deal.value, deal.currency)}</p>
          {deal.expected_close && (
            <p className="text-xs text-muted-foreground">
              {format(new Date(deal.expected_close), 'd. MMM yyyy', { locale: nb })}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 
                className="font-semibold truncate cursor-pointer hover:text-primary"
                onClick={() => onClick?.(deal.id)}
              >
                {deal.title}
              </h3>
              <Badge className={stageInfo.color}>{stageInfo.label}</Badge>
            </div>
            
            {deal.organization && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{deal.organization.name}</span>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(deal.id)}>
                <Edit className="h-4 w-4 mr-2" />
                Rediger
              </DropdownMenuItem>
              {!isClosed && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onStageChange?.(deal.id, 'closed_won')}>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Marker som vunnet
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStageChange?.(deal.id, 'closed_lost')}>
                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                    Marker som tapt
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => onDelete?.(deal.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Slett
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Verdi</p>
            <p className="text-lg font-semibold">
              {formatCurrency(deal.value, deal.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sannsynlighet</p>
            <p className="text-lg font-semibold">
              {deal.probability ?? 0}%
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          {deal.expected_close && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Forventet {format(new Date(deal.expected_close), 'd. MMMM yyyy', { locale: nb })}</span>
            </div>
          )}
          
          {deal.contact && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{deal.contact.name}</span>
            </div>
          )}
        </div>

        {deal.owner && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {deal.owner.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{deal.owner.name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onClick?.(deal.id)}>
              Vis detaljer
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
