'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Megaphone, Users, CheckCircle2, Clock, TrendingUp } from 'lucide-react'
import {
  CampaignApplicationList,
  CampaignFiltersPanel,
} from '@/components/campaigns'
import { useCampaignStats } from '@/hooks/use-campaign-applications'
import type { CampaignFilters } from '@/types/campaign'
import { getStatusConfig, getPositionConfig } from '@/lib/utils/campaign-constants'

export default function CampaignsPage() {
  const [filters, setFilters] = useState<CampaignFilters>({})
  const { data: stats, isLoading: statsLoading } = useCampaignStats()

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Megaphone className="h-8 w-8" />
          Kampanjesøknader
        </h1>
        <p className="text-muted-foreground mt-1">
          Søknader fra kampanjesider på bluecrew.no
        </p>
      </div>

      {/* Stats Cards - Only shows COMPLETE applications (Vipps + CV verified) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Komplette søknader"
          value={stats?.total || 0}
          icon={Megaphone}
          color="blue"
          loading={statsLoading}
          subtitle="Vipps + CV verifisert"
        />
        <StatsCard
          title="Nye i dag"
          value={stats?.newToday || 0}
          icon={TrendingUp}
          color="green"
          loading={statsLoading}
          subtitle="Siste 24 timer"
        />
        <StatsCard
          title="Klar for vurdering"
          value={stats?.byStatus.pending || 0}
          icon={Clock}
          color="orange"
          loading={statsLoading}
          subtitle="Nye komplette søknader"
        />
        <StatsCard
          title="Med profil"
          value={stats?.verified || 0}
          icon={CheckCircle2}
          color="purple"
          loading={statsLoading}
          subtitle="Koblet til Bluecrew-profil"
        />
      </div>

      {/* Status Overview */}
      {stats && !statsLoading && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium mb-3">Status oversikt</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(stats.byStatus).map(([status, count]) => {
                if (count === 0) return null
                const config = getStatusConfig(status as any)
                return (
                  <Badge
                    key={status}
                    variant="secondary"
                    className={`${config.bgColor} ${config.textColor} text-sm`}
                  >
                    {config.label}: {count}
                  </Badge>
                )
              })}
            </div>

            <h3 className="text-sm font-medium mb-3 mt-4">Stillinger</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(stats.byPosition).map(([position, count]) => {
                if (count === 0) return null
                const config = getPositionConfig(position as any)
                const Icon = config.icon
                return (
                  <Badge key={position} variant="outline" className="text-sm">
                    <Icon className="h-3 w-3 mr-1" />
                    {config.label}: {count}
                  </Badge>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content - Filters and List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <CampaignFiltersPanel filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Application List */}
        <div className="lg:col-span-3">
          <CampaignApplicationList filters={filters} onFiltersChange={setFilters} />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════

interface StatsCardProps {
  title: string
  value: number
  icon: React.ElementType
  color: 'blue' | 'green' | 'purple' | 'orange'
  loading: boolean
  subtitle?: string
}

function StatsCard({ title, value, icon: Icon, color, loading, subtitle }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-500',
    green: 'bg-green-500/10 text-green-500',
    purple: 'bg-purple-500/10 text-purple-500',
    orange: 'bg-orange-500/10 text-orange-500',
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            {loading ? (
              <>
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-4 w-24" />
              </>
            ) : (
              <>
                <p className="text-3xl font-bold">{value}</p>
                <p className="text-sm text-muted-foreground truncate">{title}</p>
                {subtitle && (
                  <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
