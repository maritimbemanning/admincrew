"use client"

import { useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  ClipboardList,
  AlertTriangle,
  Plus,
  Target,
  Anchor,
  Zap,
  FileText,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  TrendingUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardStats, useRecentActivity } from "@/hooks/use-dashboard-stats"
import { useDealsPipeline, dealStages } from "@/hooks/use-deals"
import { formatDistanceToNow, format } from "date-fns"
import { nb } from "date-fns/locale"
import { cn } from "@/lib/utils"

// ═══════════════════════════════════════════════════════════════════════════════
// MISSION OPERATIONS CENTER DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

export default function DashboardClient() {
  const router = useRouter()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity()
  const { data: pipelineData, isLoading: pipelineLoading } = useDealsPipeline()

  // Calculate operational metrics
  const metrics = useMemo(() => {
    if (!stats) return null

    const total = (stats.activeAssignments || 0) + (stats.openRequests || 0)
    const fillRate = total > 0 ? Math.round((stats.activeAssignments / total) * 100) : 0

    // Determine system status based on metrics
    const hasUrgent = stats.urgentRequests > 0
    const hasCritical = stats.expiringCertificates > 5 || stats.compliancePending > 10

    const systemStatus: 'nominal' | 'attention' | 'critical' =
      hasCritical ? 'critical' : hasUrgent ? 'attention' : 'nominal'

    return {
      fillRate,
      systemStatus,
    }
  }, [stats])

  // Keyboard shortcut handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only trigger if no input is focused
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return

    const shortcuts: Record<string, string> = {
      'n+c': '/candidates/new',
      'n+r': '/operations/requests/new',
      'n+d': '/crm/deals/new',
      'q+m': '/operations/matching',
      'g+c': '/candidates',
      'g+o': '/crm',
    }

    // Simple two-key combo detection
    if (e.key.toLowerCase() === 'n' || e.key.toLowerCase() === 'q' || e.key.toLowerCase() === 'g') {
      const waitForSecond = (first: string) => {
        const handler = (e2: KeyboardEvent) => {
          const combo = `${first}+${e2.key.toLowerCase()}`
          const path = shortcuts[combo]
          if (path) {
            e2.preventDefault()
            router.push(path)
          }
          document.removeEventListener('keydown', handler)
        }
        setTimeout(() => document.removeEventListener('keydown', handler), 500)
        document.addEventListener('keydown', handler)
      }
      waitForSecond(e.key.toLowerCase())
    }
  }, [router])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (statsLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ═══════════════════════════════════════════════════════════════════════
          SITUATION OVERVIEW - Glass Panel Hero
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="glass-panel rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-navy-800/10 dark:bg-navy-800/50">
              <Target className="h-5 w-5 text-gold-500" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Situation Overview</h1>
              <p className="text-coordinates">
                {format(new Date(), "yyyy-MM-dd • HH:mm", { locale: nb })} UTC+1
              </p>
            </div>
          </div>
          <SystemStatusBadge status={metrics?.systemStatus || 'nominal'} />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
          <MetricCard
            label="Tilgjengelige"
            value={stats?.availableCandidates || 0}
            status="green"
            subtitle="kandidater"
          />
          <MetricCard
            label="Aktive Oppdrag"
            value={stats?.activeAssignments || 0}
            status="blue"
            subtitle="pågående"
          />
          <MetricCard
            label="Åpne Requests"
            value={stats?.openRequests || 0}
            status={stats?.urgentRequests ? 'yellow' : 'green'}
            subtitle={stats?.urgentRequests ? `${stats.urgentRequests} haster` : 'forespørsler'}
          />
          <MetricCard
            label="Fill Rate"
            value={`${metrics?.fillRate || 0}%`}
            status={metrics?.fillRate && metrics.fillRate >= 70 ? 'green' : metrics?.fillRate && metrics.fillRate >= 50 ? 'yellow' : 'red'}
            subtitle="kapasitet"
          />
          <MetricCard
            label="Starter Denne Uka"
            value={stats?.startingThisWeek || 0}
            status="blue"
            subtitle="oppdrag"
          />
        </div>

        {/* Alert Indicators */}
        {(stats?.urgentRequests || stats?.expiringCertificates || stats?.compliancePending) ? (
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-border/50">
            {stats.urgentRequests > 0 && (
              <AlertIndicator
                label="Haster"
                count={stats.urgentRequests}
                status="red"
                onClick={() => router.push('/operations/requests?priority=urgent')}
              />
            )}
            {stats.expiringCertificates > 0 && (
              <AlertIndicator
                label="Utløpende Sert."
                count={stats.expiringCertificates}
                status="yellow"
                onClick={() => router.push('/candidates?certExpiring=30')}
              />
            )}
            {stats.compliancePending > 0 && (
              <AlertIndicator
                label="Compliance"
                count={stats.compliancePending}
                status="yellow"
                onClick={() => router.push('/candidates/compliance')}
              />
            )}
          </div>
        ) : null}
      </section>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* ═══════════════════════════════════════════════════════════════════════
            QUICK ACTIONS - Operation Cards
            ═══════════════════════════════════════════════════════════════════════ */}
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-tactical text-muted-foreground">Operations</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <OperationCard
              title="Ny Kandidat"
              description="Registrer ny maritim profesjonell"
              icon={Users}
              shortcut="N C"
              onClick={() => router.push('/candidates/new')}
            />
            <OperationCard
              title="Ny Request"
              description="Opprett bemanningsforespørsel"
              icon={ClipboardList}
              shortcut="N R"
              onClick={() => router.push('/operations/requests/new')}
            />
            <OperationCard
              title="Quick Match"
              description="10-sekunders matching engine"
              icon={Zap}
              shortcut="Q M"
              highlight
              onClick={() => router.push('/operations/matching')}
            />
            <OperationCard
              title="Ny Deal"
              description="Opprett salgsmulighet"
              icon={TrendingUp}
              shortcut="N D"
              onClick={() => router.push('/crm/deals/new')}
            />
          </div>

          {/* Secondary Actions */}
          <div className="grid gap-3 sm:grid-cols-3 mt-4">
            <SecondaryActionCard
              label="Kandidater"
              count={stats?.availableCandidates || 0}
              icon={Users}
              shortcut="G C"
              onClick={() => router.push('/candidates')}
            />
            <SecondaryActionCard
              label="CRM"
              icon={Building2}
              shortcut="G O"
              onClick={() => router.push('/crm')}
            />
            <SecondaryActionCard
              label="Timelister"
              count={stats?.pendingApprovals || 0}
              icon={Clock}
              badge={stats?.pendingApprovals ? 'Pending' : undefined}
              onClick={() => router.push('/timesheets/approve')}
            />
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════
            COMMS LOG - Activity Feed
            ═══════════════════════════════════════════════════════════════════════ */}
        <section className="lg:col-span-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-tactical text-muted-foreground">Comms Log</span>
            <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-wider">
              <span className="signal-light signal-light-green w-1.5 h-1.5 mr-1.5" />
              Live
            </Badge>
          </div>

          <div className="glass-panel rounded-xl p-4 space-y-1 max-h-[360px] overflow-auto">
            {activityLoading ? (
              <ActivitySkeleton />
            ) : recentActivity?.length ? (
              recentActivity.map((activity, i) => (
                <CommsLogEntry
                  key={activity.id}
                  activity={activity}
                  isLatest={i === 0}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Ingen aktivitet enda</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          RADAR STRIP - Pipeline Mini-View
          ═══════════════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-tactical text-muted-foreground">Pipeline Radar</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>
          <button
            onClick={() => router.push('/crm/deals')}
            className="text-xs text-muted-foreground hover:text-gold-500 transition-colors font-mono uppercase tracking-wider"
          >
            Full View →
          </button>
        </div>

        {pipelineLoading ? (
          <RadarStripSkeleton />
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {pipelineData?.columns
              .filter(col => col.id !== 'closed_lost')
              .map((stage) => (
                <RadarStripBlock
                  key={stage.id}
                  label={stage.label}
                  count={stage.count}
                  value={stage.totalValue}
                  isWon={stage.id === 'closed_won'}
                  onClick={() => router.push(`/crm/deals?stage=${stage.id}`)}
                />
              ))}
          </div>
        )}

        {/* Pipeline Summary */}
        {pipelineData?.stats && (
          <div className="flex items-center gap-6 mt-3 pt-3 border-t border-border/30">
            <div className="text-sm">
              <span className="text-muted-foreground">Total Pipeline:</span>{' '}
              <span className="font-mono font-medium text-gold-500">
                {formatNOK(pipelineData.stats.totalValue)}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Vektet:</span>{' '}
              <span className="font-mono font-medium">
                {formatNOK(pipelineData.stats.weightedValue)}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Vunnet:</span>{' '}
              <span className="font-mono font-medium text-emerald-500">
                {formatNOK(pipelineData.stats.wonValue)}
              </span>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: System Status Badge
// ═══════════════════════════════════════════════════════════════════════════════

function SystemStatusBadge({ status }: { status: 'nominal' | 'attention' | 'critical' }) {
  const config = {
    nominal: { label: 'Nominal', color: 'signal-light-green', textClass: 'text-emerald-600 dark:text-emerald-400' },
    attention: { label: 'Attention', color: 'signal-light-yellow', textClass: 'text-amber-600 dark:text-amber-400' },
    critical: { label: 'Critical', color: 'signal-light-red', textClass: 'text-red-600 dark:text-red-400' },
  }

  const { label, color, textClass } = config[status]

  return (
    <div className={cn("flex items-center gap-2 text-xs font-mono uppercase tracking-wider", textClass)}>
      <span className={cn("signal-light w-2 h-2", color)} />
      {label}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Metric Card (for Situation Overview)
// ═══════════════════════════════════════════════════════════════════════════════

function MetricCard({
  label,
  value,
  status,
  subtitle
}: {
  label: string
  value: string | number
  status: 'green' | 'yellow' | 'red' | 'blue'
  subtitle: string
}) {
  const signalClass = {
    green: 'signal-light-green',
    yellow: 'signal-light-yellow',
    red: 'signal-light-red',
    blue: 'signal-light-blue',
  }[status]

  return (
    <div className="relative p-4 rounded-xl bg-card/50 dark:bg-navy-800/30 border border-border/30">
      <div className="absolute top-3 right-3">
        <span className={cn("signal-light w-2 h-2", signalClass)} />
      </div>
      <p className="text-3xl md:text-4xl font-mono font-bold tracking-tight">
        {value}
      </p>
      <p className="text-xs font-medium text-foreground mt-1">{label}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{subtitle}</p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Alert Indicator
// ═══════════════════════════════════════════════════════════════════════════════

function AlertIndicator({
  label,
  count,
  status,
  onClick
}: {
  label: string
  count: number
  status: 'red' | 'yellow'
  onClick: () => void
}) {
  const bgClass = status === 'red'
    ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30'
    : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30'
  const textClass = status === 'red' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
  const signalClass = status === 'red' ? 'signal-light-red' : 'signal-light-yellow'

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors",
        bgClass
      )}
    >
      <span className={cn("signal-light w-2 h-2", signalClass)} />
      <span className={cn("text-xs font-medium", textClass)}>{label}</span>
      <span className={cn("text-xs font-mono font-bold", textClass)}>{count}</span>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Operation Card (Quick Actions)
// ═══════════════════════════════════════════════════════════════════════════════

function OperationCard({
  title,
  description,
  icon: Icon,
  shortcut,
  highlight,
  onClick
}: {
  title: string
  description: string
  icon: React.ElementType
  shortcut: string
  highlight?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative text-left p-5 rounded-xl transition-all duration-200",
        "bg-card dark:bg-navy-800/50 border border-border/50",
        "hover:shadow-lg hover:shadow-gold-500/10 hover:border-gold-500/30",
        "hover:-translate-y-0.5",
        highlight && "ring-1 ring-gold-500/30"
      )}
    >
      {/* Docking Stripes Header */}
      <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl docking-stripes" />

      {/* Keyboard Shortcut */}
      <div className="absolute top-3 right-3 flex gap-1">
        {shortcut.split(' ').map((key, i) => (
          <kbd
            key={i}
            className="px-1.5 py-0.5 text-[10px] font-mono bg-muted/50 rounded border border-border/50 text-muted-foreground"
          >
            {key}
          </kbd>
        ))}
      </div>

      <div className={cn(
        "p-2.5 rounded-lg w-fit mb-3 transition-colors",
        highlight
          ? "bg-gold-500/20 text-gold-600 dark:text-gold-400"
          : "bg-muted/50 text-muted-foreground group-hover:bg-gold-500/10 group-hover:text-gold-600 dark:group-hover:text-gold-400"
      )}>
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Secondary Action Card
// ═══════════════════════════════════════════════════════════════════════════════

function SecondaryActionCard({
  label,
  count,
  icon: Icon,
  shortcut,
  badge,
  onClick
}: {
  label: string
  count?: number
  icon: React.ElementType
  shortcut?: string
  badge?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 p-3 rounded-lg transition-all",
        "bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border/50"
      )}
    >
      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      <span className="text-sm font-medium">{label}</span>
      {count !== undefined && (
        <span className="ml-auto font-mono text-sm text-muted-foreground">{count}</span>
      )}
      {badge && (
        <Badge variant="secondary" className="ml-auto text-[10px]">{badge}</Badge>
      )}
      {shortcut && !count && !badge && (
        <kbd className="ml-auto text-[10px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          {shortcut}
        </kbd>
      )}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Comms Log Entry
// ═══════════════════════════════════════════════════════════════════════════════

function CommsLogEntry({
  activity,
  isLatest
}: {
  activity: { id: string; type: string; title: string; subtitle?: string; timestamp: string }
  isLatest: boolean
}) {
  const getTypeIcon = () => {
    switch (activity.type) {
      case 'assignment_started': return Anchor
      case 'contract_signed': return FileText
      case 'request_created': return ClipboardList
      case 'candidate_created': return Users
      default: return Calendar
    }
  }

  const Icon = getTypeIcon()
  const signalClass = isLatest ? 'signal-light-green' : 'signal-light-gray'

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg transition-colors",
      isLatest && "bg-emerald-500/5 border border-emerald-500/20"
    )}>
      <div className="flex-shrink-0 mt-0.5">
        <span className={cn("signal-light w-2 h-2", signalClass, isLatest && "animate-pulse")} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium truncate">{activity.title}</span>
        </div>
        {activity.subtitle && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{activity.subtitle}</p>
        )}
      </div>

      <time className="text-[10px] font-mono text-muted-foreground flex-shrink-0 tabular-nums">
        {format(new Date(activity.timestamp), "HH:mm")}
      </time>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT: Radar Strip Block
// ═══════════════════════════════════════════════════════════════════════════════

function RadarStripBlock({
  label,
  count,
  value,
  isWon,
  onClick
}: {
  label: string
  count: number
  value: number
  isWon?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-shrink-0 min-w-[140px] p-3 rounded-lg transition-all",
        "bg-card dark:bg-navy-800/50 border border-border/50",
        "hover:border-gold-500/30 hover:shadow-md",
        isWon && "border-emerald-500/30 bg-emerald-500/5"
      )}
    >
      <div className="docking-stripes h-0.5 w-full rounded-full mb-2" />

      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
          {label}
        </span>
        <Badge
          variant={count > 0 ? "default" : "secondary"}
          className={cn(
            "text-[10px] font-mono h-5 min-w-5",
            isWon && count > 0 && "bg-emerald-500"
          )}
        >
          {count}
        </Badge>
      </div>

      <p className={cn(
        "text-sm font-mono font-medium",
        isWon ? "text-emerald-500" : "text-gold-500"
      )}>
        {formatNOK(value)}
      </p>
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function formatNOK(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`
  }
  return value.toString()
}

// ═══════════════════════════════════════════════════════════════════════════════
// SKELETONS
// ═══════════════════════════════════════════════════════════════════════════════

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Hero Skeleton */}
      <div className="glass-panel rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-32 mt-1" />
            </div>
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-4">
          <Skeleton className="h-4 w-24" />
          <div className="grid gap-3 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="lg:col-span-5">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-[360px] rounded-xl" />
        </div>
      </div>

      {/* Radar Strip Skeleton */}
      <div>
        <Skeleton className="h-4 w-32 mb-3" />
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-36 rounded-lg flex-shrink-0" />
          ))}
        </div>
      </div>
    </div>
  )
}

function ActivitySkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3">
          <Skeleton className="h-2 w-2 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2 mt-1" />
          </div>
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  )
}

function RadarStripSkeleton() {
  return (
    <div className="flex gap-2">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-20 w-36 rounded-lg flex-shrink-0" />
      ))}
    </div>
  )
}
