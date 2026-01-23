'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Megaphone, 
  Zap, 
  Radio, 
  Anchor, 
  Flame, 
  Wrench,
  Ship,
  Users,
} from 'lucide-react'
import { CampaignApplicationList } from '@/components/campaigns'
import { useCampaignStats } from '@/hooks/use-campaign-applications'
import type { CampaignFilters, CampaignPosition } from '@/types/campaign'

// ═══════════════════════════════════════════════════════
// POOL CONFIGURATION - Campaign 2026 Positions
// ═══════════════════════════════════════════════════════

const POOLS = [
  { value: 'all', label: 'Alle', icon: Users },
  { value: 'elektriker', label: 'Elektriker', icon: Zap },
  { value: 'rov', label: 'ROV', icon: Radio },
  { value: 'riggere', label: 'Rigger', icon: Anchor },
  { value: 'sveiser', label: 'Sveiser', icon: Flame },
  { value: 'mekaniker', label: 'Mekaniker', icon: Wrench },
  { value: 'eto', label: 'ETO', icon: Zap },
  { value: 'offshore', label: 'Offshore', icon: Ship },
] as const

type PoolValue = typeof POOLS[number]['value']

export default function CampaignsPage() {
  const [activePool, setActivePool] = useState<PoolValue>('all')
  const { data: stats, isLoading: statsLoading } = useCampaignStats()

  // Build filters based on active pool
  const filters: CampaignFilters = activePool === 'all' 
    ? {} 
    : { positions: [activePool as CampaignPosition] }

  // Get count for each pool
  const getPoolCount = (pool: PoolValue): number => {
    if (!stats) return 0
    if (pool === 'all') return stats.total
    return stats.byPosition[pool as CampaignPosition] || 0
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Megaphone className="h-8 w-8" />
            Kampanje 2026
          </h1>
          <p className="text-muted-foreground mt-1">
            Offshore stillinger - Vipps + CV verifiserte søkere
          </p>
        </div>
        {!statsLoading && stats && (
          <div className="text-right">
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">komplette søknader</p>
          </div>
        )}
      </div>

      {/* Pool Tabs */}
      <Tabs value={activePool} onValueChange={(v) => setActivePool(v as PoolValue)}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {POOLS.map((pool) => {
            const Icon = pool.icon
            const count = getPoolCount(pool.value)
            const isActive = activePool === pool.value
            
            return (
              <TabsTrigger
                key={pool.value}
                value={pool.value}
                className="flex items-center gap-2 data-[state=active]:bg-background"
              >
                <Icon className="h-4 w-4" />
                <span>{pool.label}</span>
                {!statsLoading && (
                  <Badge 
                    variant={isActive ? "default" : "secondary"} 
                    className="ml-1 text-xs"
                  >
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>
      </Tabs>

      {/* Quick Stats for Active Pool */}
      {stats && !statsLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickStat 
            label="Nye" 
            value={stats.byStatus.pending} 
            color="blue" 
          />
          <QuickStat 
            label="Kontaktet" 
            value={stats.byStatus.kontaktet} 
            color="purple" 
          />
          <QuickStat 
            label="Intervju" 
            value={stats.byStatus.intervju} 
            color="orange" 
          />
          <QuickStat 
            label="Godkjent" 
            value={stats.byStatus.godkjent} 
            color="green" 
          />
        </div>
      )}

      {/* Application List */}
      <CampaignApplicationList filters={filters} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════

interface QuickStatProps {
  label: string
  value: number
  color: 'blue' | 'green' | 'purple' | 'orange'
}

function QuickStat({ label, value, color }: QuickStatProps) {
  const colorClasses = {
    blue: 'border-blue-500/50 bg-blue-500/5',
    green: 'border-green-500/50 bg-green-500/5',
    purple: 'border-purple-500/50 bg-purple-500/5',
    orange: 'border-orange-500/50 bg-orange-500/5',
  }

  return (
    <Card className={`border ${colorClasses[color]}`}>
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-2xl font-bold">{value}</span>
        </div>
      </CardContent>
    </Card>
  )
}
