"use client"

import { useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Users,
  ClipboardList,
  Plus,
  Zap,
  FileText,
  Building2,
  Calendar,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardStats, useRecentActivity } from "@/hooks/use-dashboard-stats"
import { useDealsPipeline } from "@/hooks/use-deals"
import { format } from "date-fns"
import { nb } from "date-fns/locale"
import { cn } from "@/lib/utils"

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

    return { fillRate }
  }, [stats])

  // Keyboard shortcut handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return

    const shortcuts: Record<string, string> = {
      'n+c': '/candidates/new',
      'n+r': '/operations/requests/new',
      'n+d': '/crm/deals/new',
      'q+m': '/operations/matching',
      'g+c': '/candidates',
      'g+o': '/crm',
    }

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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {format(new Date(), "EEEE d. MMMM yyyy", { locale: nb })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tilgjengelige kandidater"
          value={stats?.availableCandidates || 0}
          change={null}
          onClick={() => router.push('/candidates?status=available')}
        />
        <StatCard
          label="Aktive oppdrag"
          value={stats?.activeAssignments || 0}
          change={null}
          onClick={() => router.push('/operations/assignments?status=active')}
        />
        <StatCard
          label="Åpne forespørsler"
          value={stats?.openRequests || 0}
          highlight={stats?.urgentRequests ? stats.urgentRequests > 0 : false}
          subtitle={stats?.urgentRequests ? `${stats.urgentRequests} haster` : undefined}
          onClick={() => router.push('/operations/requests')}
        />
        <StatCard
          label="Fill rate"
          value={`${metrics?.fillRate || 0}%`}
          change={null}
          onClick={() => router.push('/operations')}
        />
      </div>

      {/* Alerts */}
      {(stats?.urgentRequests || stats?.expiringCertificates || stats?.compliancePending) ? (
        <div className="flex flex-wrap gap-3">
          {stats.urgentRequests > 0 && (
            <AlertBadge
              label="Haster"
              count={stats.urgentRequests}
              variant="error"
              onClick={() => router.push('/operations/requests?priority=urgent')}
            />
          )}
          {stats.expiringCertificates > 0 && (
            <AlertBadge
              label="Utlopende sertifikater"
              count={stats.expiringCertificates}
              variant="warning"
              onClick={() => router.push('/candidates?certExpiring=30')}
            />
          )}
          {stats.compliancePending > 0 && (
            <AlertBadge
              label="Compliance venter"
              count={stats.compliancePending}
              variant="warning"
              onClick={() => router.push('/candidates/compliance')}
            />
          )}
        </div>
      ) : null}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Hurtighandlinger</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ActionCard
              title="Ny kandidat"
              description="Registrer ny maritim profesjonell"
              icon={Users}
              shortcut="N C"
              onClick={() => router.push('/candidates/new')}
            />
            <ActionCard
              title="Ny forespørsel"
              description="Opprett bemanningsforespørsel"
              icon={ClipboardList}
              shortcut="N R"
              onClick={() => router.push('/operations/requests/new')}
            />
            <ActionCard
              title="Quick Match"
              description="Finn kandidater pa 10 sekunder"
              icon={Zap}
              shortcut="Q M"
              highlight
              onClick={() => router.push('/operations/matching')}
            />
            <ActionCard
              title="Ny deal"
              description="Opprett salgsmulighet"
              icon={TrendingUp}
              shortcut="N D"
              onClick={() => router.push('/crm/deals/new')}
            />
          </div>

          {/* Secondary Links */}
          <div className="grid gap-2 sm:grid-cols-3 pt-2">
            <QuickLink
              label="Alle kandidater"
              count={stats?.availableCandidates}
              href="/candidates"
            />
            <QuickLink
              label="CRM Pipeline"
              href="/crm"
            />
            <QuickLink
              label="Timelister"
              count={stats?.pendingApprovals}
              badge={stats?.pendingApprovals ? "Venter" : undefined}
              href="/timesheets/approve"
            />
          </div>
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Siste aktivitet</h2>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Live
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {activityLoading ? (
              <ActivitySkeleton />
            ) : recentActivity?.length ? (
              recentActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            ) : (
              <div className="p-8 text-center">
                <Clock className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Ingen aktivitet enda</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Pipeline oversikt</h2>
          <Button variant="ghost" size="sm" onClick={() => router.push('/crm/deals')}>
            Se alle
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>

        {pipelineLoading ? (
          <PipelineSkeleton />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {pipelineData?.columns
                .filter(col => col.id !== 'closed_lost')
                .map((stage) => (
                  <PipelineCard
                    key={stage.id}
                    label={stage.label}
                    count={stage.count}
                    value={stage.totalValue}
                    isWon={stage.id === 'closed_won'}
                    onClick={() => router.push(`/crm/deals?stage=${stage.id}`)}
                  />
                ))}
            </div>

            {/* Pipeline Summary */}
            {pipelineData?.stats && (
              <div className="flex flex-wrap items-center gap-6 pt-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-medium">{formatNOK(pipelineData.stats.totalValue)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Vektet: </span>
                  <span className="font-medium">{formatNOK(pipelineData.stats.weightedValue)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Vunnet: </span>
                  <span className="font-medium text-green-600">{formatNOK(pipelineData.stats.wonValue)}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Stat Card Component
function StatCard({
  label,
  value,
  change,
  highlight,
  subtitle,
  onClick
}: {
  label: string
  value: string | number
  change?: number | null
  highlight?: boolean
  subtitle?: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "bg-card rounded-xl border border-border p-5 text-left transition-all hover:shadow-md hover:border-border/80",
        highlight && "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20"
      )}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-semibold tracking-tight mt-1">{value}</p>
      {subtitle && (
        <p className={cn(
          "text-xs mt-1",
          highlight ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
        )}>
          {subtitle}
        </p>
      )}
      {change !== null && change !== undefined && (
        <div className={cn(
          "flex items-center gap-1 text-xs mt-2",
          change >= 0 ? "text-green-600" : "text-red-600"
        )}>
          <ArrowUpRight className={cn("h-3 w-3", change < 0 && "rotate-180")} />
          {Math.abs(change)}% fra forrige uke
        </div>
      )}
    </button>
  )
}

// Alert Badge Component
function AlertBadge({
  label,
  count,
  variant,
  onClick
}: {
  label: string
  count: number
  variant: 'error' | 'warning'
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
        variant === 'error'
          ? "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900"
          : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-400 dark:hover:bg-amber-900"
      )}
    >
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        variant === 'error' ? "bg-red-500" : "bg-amber-500"
      )} />
      {label}
      <span className="font-semibold">{count}</span>
    </button>
  )
}

// Action Card Component
function ActionCard({
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
        "group relative text-left p-5 rounded-xl transition-all",
        "bg-card border border-border",
        "hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800",
        highlight && "border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/20"
      )}
    >
      {/* Keyboard Shortcut */}
      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {shortcut.split(' ').map((key, i) => (
          <kbd
            key={i}
            className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border border-border text-muted-foreground"
          >
            {key}
          </kbd>
        ))}
      </div>

      <div className={cn(
        "p-2 rounded-lg w-fit mb-3",
        highlight
          ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400"
          : "bg-muted text-muted-foreground group-hover:bg-indigo-100 group-hover:text-indigo-600 dark:group-hover:bg-indigo-900 dark:group-hover:text-indigo-400"
      )}>
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="font-medium text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
    </button>
  )
}

// Quick Link Component
function QuickLink({
  label,
  count,
  badge,
  href
}: {
  label: string
  count?: number
  badge?: string
  href: string
}) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(href)}
      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
    >
      <span className="text-sm font-medium">{label}</span>
      {count !== undefined && !badge && (
        <span className="text-sm text-muted-foreground">{count}</span>
      )}
      {badge && (
        <Badge variant="secondary" className="text-xs">{badge}</Badge>
      )}
      {!count && !badge && (
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  )
}

// Activity Item Component
function ActivityItem({
  activity
}: {
  activity: { id: string; type: string; title: string; subtitle?: string; timestamp: string }
}) {
  const getTypeIcon = () => {
    switch (activity.type) {
      case 'assignment_started': return FileText
      case 'contract_signed': return FileText
      case 'request_created': return ClipboardList
      case 'candidate_created': return Users
      default: return Calendar
    }
  }

  const Icon = getTypeIcon()

  return (
    <div className="flex items-start gap-3 p-4">
      <div className="p-1.5 rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{activity.title}</p>
        {activity.subtitle && (
          <p className="text-xs text-muted-foreground truncate">{activity.subtitle}</p>
        )}
      </div>
      <time className="text-xs text-muted-foreground tabular-nums">
        {format(new Date(activity.timestamp), "HH:mm")}
      </time>
    </div>
  )
}

// Pipeline Card Component
function PipelineCard({
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
        "p-4 rounded-xl transition-all text-left",
        "bg-card border border-border",
        "hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800",
        isWon && "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Badge variant={count > 0 ? "default" : "secondary"} className={cn(
          "text-xs",
          isWon && count > 0 && "bg-green-600"
        )}>
          {count}
        </Badge>
      </div>
      <p className={cn(
        "text-lg font-semibold",
        isWon ? "text-green-600" : "text-foreground"
      )}>
        {formatNOK(value)}
      </p>
    </button>
  )
}

// Helpers
function formatNOK(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`
  }
  return value.toString()
}

// Skeletons
function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-48 mt-1" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="grid gap-3 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

function ActivitySkeleton() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4">
          <Skeleton className="h-8 w-8 rounded-md" />
          <div className="flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2 mt-1" />
          </div>
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </>
  )
}

function PipelineSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>
  )
}
