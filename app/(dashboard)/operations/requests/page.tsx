'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Zap,
  Calendar,
  Users,
  Clock,
  AlertTriangle,
  Ship,
  Anchor,
  Target,
  Radio,
  Navigation,
  Crosshair,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/command/page-header'
import { SignalLight } from '@/components/command/signal-light'
import { RequestKanban } from '@/components/operations/request-kanban'
import { useRequests } from '@/hooks/use-requests'
import type { RequestFilters, RequestStatus, PriorityLevel } from '@/types/operations'
import {
  REQUEST_STATUS_LABELS,
  PRIORITY_LABELS,
} from '@/types/operations'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

// Priority to signal status mapping
const priorityToSignal: Record<PriorityLevel, 'available' | 'available_soon' | 'on_assignment' | 'unavailable'> = {
  urgent: 'unavailable', // Red
  high: 'available_soon', // Yellow
  medium: 'on_assignment', // Blue
  low: 'available', // Green
}

export default function RequestsPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'kanban' | 'grid'>('grid')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<RequestFilters>({})
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const { data, isLoading } = useRequests({
    filters,
    page,
    pageSize: 20,
  })

  // Calculate stats
  const activeCount = data?.requests.filter(r =>
    ['approved', 'matching', 'shortlisted', 'offer_sent'].includes(r.status)
  ).length || 0
  const matchingCount = data?.requests.filter(r => r.status === 'matching').length || 0
  const urgentCount = data?.requests.filter(r => r.priority === 'urgent').length || 0

  // Assignments this week (simulated - would come from assignments hook)
  const assignmentsThisWeek = data?.requests.filter(r => r.status === 'converted').length || 0

  // Active filters count
  const activeFilterCount = [
    filters.status?.length,
    filters.priority?.length,
    filters.search,
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Background gradient */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_transparent_55%),radial-gradient(circle_at_75%_25%,_rgba(160,133,99,0.12),_transparent_45%)]" />

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Fleet Operations Header */}
        <PageHeader
          coordinates={[
            { label: 'COMMAND', href: '/' },
            { label: 'OPERATIONS', href: '/operations' },
            { label: 'FLEET COMMAND' },
          ]}
          title="FLEET OPERATIONS"
          subtitle={`${data?.total || 0} aktive operasjoner`}
          icon={<Ship className="h-6 w-6" />}
          systemStatus="live"
          stats={[
            { label: 'AKTIVE', value: activeCount, trend: activeCount > 0 ? 'up' : 'neutral' },
            { label: 'MATCHING', value: matchingCount },
            { label: 'HASTER', value: urgentCount, trend: urgentCount > 0 ? 'up' : 'neutral' },
            { label: 'DENNE UKEN', value: assignmentsThisWeek },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <QuickMatchButton />
              <Button asChild className="btn-gold text-tactical">
                <Link href="/operations/requests/new">
                  <Plus className="h-4 w-4 mr-1.5" />
                  NY OPERASJON
                </Link>
              </Button>
            </div>
          }
        />

        {/* Targeting System - Filter Panel */}
        <div className="glass-panel rounded-xl overflow-hidden">
          {/* Docking Stripes Header */}
          <div className="docking-stripes px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-gold-400" />
              <span className="text-tactical text-gold-400">TARGETING SYSTEM</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="text-tactical h-7"
            >
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              FILTERS
              {activeFilterCount > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center bg-gold-500 text-navy-900 text-[10px]">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Search + View Toggle */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk operasjoner, fartøy, roller..."
                  className="pl-10 h-10 bg-slate-900/50 border-white/10 focus:border-gold-500/50 text-sm"
                  value={filters.search || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                />
                {filters.search && (
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-white/10 rounded-lg overflow-hidden bg-slate-900/50 ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'rounded-none h-10 px-3 text-tactical',
                    viewMode === 'grid' && 'bg-gold-500/20 text-gold-400'
                  )}
                  onClick={() => setViewMode('grid')}
                >
                  <LayoutGrid className="h-4 w-4 mr-1.5" />
                  GRID
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'rounded-none h-10 px-3 text-tactical',
                    viewMode === 'kanban' && 'bg-gold-500/20 text-gold-400'
                  )}
                  onClick={() => setViewMode('kanban')}
                >
                  <List className="h-4 w-4 mr-1.5" />
                  PIPELINE
                </Button>
              </div>
            </div>

            {/* Expandable Filters */}
            {isFilterOpen && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Status Filters */}
                  <div className="space-y-3">
                    <div className="text-tactical text-muted-foreground text-[10px]">STATUS</div>
                    {(['approved', 'matching', 'shortlisted', 'offer_sent'] as RequestStatus[]).map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Switch
                          id={`status-${status}`}
                          checked={filters.status?.includes(status) || false}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              status: checked
                                ? [...(prev.status || []), status]
                                : prev.status?.filter(s => s !== status)
                            }))
                          }}
                        />
                        <Label htmlFor={`status-${status}`} className="text-sm">
                          {REQUEST_STATUS_LABELS[status]}
                        </Label>
                      </div>
                    ))}
                  </div>

                  {/* Priority Filters */}
                  <div className="space-y-3">
                    <div className="text-tactical text-muted-foreground text-[10px]">PRIORITET</div>
                    {(['urgent', 'high', 'medium', 'low'] as PriorityLevel[]).map((priority) => (
                      <div key={priority} className="flex items-center space-x-2">
                        <Switch
                          id={`priority-${priority}`}
                          checked={filters.priority?.includes(priority) || false}
                          onCheckedChange={(checked) => {
                            setFilters(prev => ({
                              ...prev,
                              priority: checked
                                ? [...(prev.priority || []), priority]
                                : prev.priority?.filter(p => p !== priority)
                            }))
                          }}
                        />
                        <Label htmlFor={`priority-${priority}`} className="text-sm flex items-center gap-2">
                          <SignalLight status={priorityToSignal[priority]} size="sm" showPulse={false} />
                          {PRIORITY_LABELS[priority]}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                <span className="text-coordinates">AKTIVE FILTRE:</span>
                {filters.search && (
                  <Badge
                    variant="outline"
                    className="border-gold-500/30 bg-gold-500/10 text-gold-400 gap-1"
                  >
                    Søk: {filters.search}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                    />
                  </Badge>
                )}
                {filters.status?.map(status => (
                  <Badge
                    key={status}
                    variant="outline"
                    className="border-gold-500/30 bg-gold-500/10 text-gold-400 gap-1"
                  >
                    {REQUEST_STATUS_LABELS[status]}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters(prev => ({
                        ...prev,
                        status: prev.status?.filter(s => s !== status)
                      }))}
                    />
                  </Badge>
                ))}
                {filters.priority?.map(priority => (
                  <Badge
                    key={priority}
                    variant="outline"
                    className="border-gold-500/30 bg-gold-500/10 text-gold-400 gap-1"
                  >
                    {PRIORITY_LABELS[priority]}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setFilters(prev => ({
                        ...prev,
                        priority: prev.priority?.filter(p => p !== priority)
                      }))}
                    />
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground h-6 text-xs"
                  onClick={() => setFilters({})}
                >
                  NULLSTILL
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {viewMode === 'kanban' ? (
          <RequestKanban filters={filters} />
        ) : (
          <>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <MissionBriefingSkeleton key={i} />
                ))}
              </div>
            ) : data?.requests.length === 0 ? (
              <EmptyRadarState />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data?.requests.map((request) => (
                  <MissionBriefingCard
                    key={request.id}
                    request={request}
                    onClick={() => router.push(`/operations/requests/${request.id}`)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="glass-panel rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-coordinates">
                    VISER {((data.page - 1) * 20) + 1}-{Math.min(data.page * 20, data.total)} AV {data.total} OPERASJONER
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="text-tactical"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      FORRIGE
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                        const pageNum = i + 1
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'ghost'}
                            size="sm"
                            className={cn(
                              'w-8 h-8 p-0 text-tactical',
                              page === pageNum && 'bg-gold-500/20 text-gold-400'
                            )}
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="text-tactical"
                    >
                      NESTE
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Quick Match Button with radar animation
function QuickMatchButton() {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Button
      variant="outline"
      className={cn(
        'relative overflow-hidden border-gold-500/50 text-gold-400 text-tactical',
        'hover:border-gold-400 hover:bg-gold-500/10 transition-all duration-300',
        isHovered && 'border-gold-400'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => router.push('/operations/matching')}
    >
      {/* Radar sweep animation */}
      {isHovered && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-500/20 to-transparent radar-sweep" />
        </div>
      )}
      <Target className={cn(
        'h-4 w-4 mr-1.5 transition-transform duration-300',
        isHovered && 'scale-110'
      )} />
      INITIATE MATCH
    </Button>
  )
}

// Mission Briefing Card
interface MissionBriefingCardProps {
  request: {
    id: string
    request_number: string
    title: string
    role_needed: string
    quantity: number
    priority: PriorityLevel
    status: RequestStatus
    start_date: string
    organization?: { id: string; name: string }
    shortlist_count?: number
    certifications_required?: string[]
  }
  onClick: () => void
}

function MissionBriefingCard({ request, onClick }: MissionBriefingCardProps) {
  const signalStatus = priorityToSignal[request.priority]
  const matchCount = request.shortlist_count || 0

  return (
    <div
      className="glass-panel rounded-xl card-tactical cursor-pointer hover:border-gold-500/30 transition-all"
      onClick={onClick}
    >
      {/* Header with ID and Signal */}
      <div className="p-4 pb-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-tactical text-gold-400 font-mono text-sm">
            {request.request_number}
          </span>
          <SignalLight status={signalStatus} size="md" />
        </div>

        {/* Vessel/Client Name */}
        <h3 className="font-semibold text-lg leading-tight mb-1">
          {request.title}
        </h3>
        {request.organization && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Ship className="h-3.5 w-3.5" />
            {request.organization.name}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Role Requirements */}
        <div>
          <div className="text-coordinates mb-1.5">ROLLE KRAV</div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-gold-500/30 bg-gold-500/10 text-gold-300">
              {request.quantity}x {request.role_needed}
            </Badge>
          </div>
        </div>

        {/* Certifications */}
        {request.certifications_required && request.certifications_required.length > 0 && (
          <div>
            <div className="text-coordinates mb-1.5">SERTIFIKATER</div>
            <div className="flex flex-wrap gap-1">
              {request.certifications_required.slice(0, 3).map((cert) => (
                <Badge
                  key={cert}
                  variant="secondary"
                  className="text-xs bg-white/5"
                >
                  {cert}
                </Badge>
              ))}
              {request.certifications_required.length > 3 && (
                <Badge variant="secondary" className="text-xs bg-white/5">
                  +{request.certifications_required.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Start Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Start: {format(new Date(request.start_date), 'dd. MMM yyyy', { locale: nb })}</span>
        </div>
      </div>

      {/* Footer - Match Count */}
      <div className="metrics-footer px-4 py-3 rounded-b-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gold-400" />
            <span className="text-sm">
              <span className="text-gold-400 font-semibold font-mono">{matchCount}</span>
              <span className="text-muted-foreground ml-1">kandidater i rekkevidde</span>
            </span>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              request.priority === 'urgent' && 'border-red-500/50 text-red-400 bg-red-500/10',
              request.priority === 'high' && 'border-amber-500/50 text-amber-400 bg-amber-500/10',
              request.priority === 'medium' && 'border-blue-500/50 text-blue-400 bg-blue-500/10',
              request.priority === 'low' && 'border-slate-500/50 text-slate-400 bg-slate-500/10'
            )}
          >
            {PRIORITY_LABELS[request.priority].toUpperCase()}
          </Badge>
        </div>
      </div>
    </div>
  )
}

// Empty State with Radar Animation
function EmptyRadarState() {
  return (
    <div className="glass-panel rounded-xl p-12 flex flex-col items-center justify-center">
      {/* Radar Animation */}
      <div className="relative w-48 h-48 mb-6">
        {/* Radar circles */}
        <div className="absolute inset-0 rounded-full border border-gold-500/20" />
        <div className="absolute inset-6 rounded-full border border-gold-500/15" />
        <div className="absolute inset-12 rounded-full border border-gold-500/10" />
        <div className="absolute inset-[4.5rem] rounded-full border border-gold-500/5" />

        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-gold-500" />
        </div>

        {/* Radar sweep line */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-full h-0.5 bg-gradient-to-r from-transparent via-gold-500/50 to-gold-500 origin-left radar-sweep"
            style={{ width: '50%', marginLeft: '50%' }}
          />
        </div>

        {/* Crosshairs */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-full h-px bg-gold-500/10" />
          <div className="absolute w-px h-full bg-gold-500/10" />
        </div>
      </div>

      <div className="text-coordinates text-lg mb-2">NO ACTIVE OPERATIONS</div>
      <p className="text-muted-foreground text-sm text-center mb-6 max-w-md">
        Ingen aktive operasjoner registrert. Opprett en ny operasjon for å starte matching mot kandidatbasen.
      </p>

      <Button asChild className="btn-gold text-tactical">
        <Link href="/operations/requests/new">
          <Plus className="h-4 w-4 mr-1.5" />
          OPPRETT OPERASJON
        </Link>
      </Button>
    </div>
  )
}

// Skeleton
function MissionBriefingSkeleton() {
  return (
    <div className="glass-panel rounded-xl">
      <div className="p-4 pb-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-28 bg-slate-800" />
          <Skeleton className="h-3 w-3 rounded-full bg-slate-800" />
        </div>
        <Skeleton className="h-6 w-48 bg-slate-800 mb-2" />
        <Skeleton className="h-4 w-32 bg-slate-800" />
      </div>
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-24 bg-slate-800" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-16 bg-slate-800" />
          <Skeleton className="h-5 w-16 bg-slate-800" />
        </div>
        <Skeleton className="h-4 w-36 bg-slate-800" />
      </div>
      <div className="px-4 py-3 bg-slate-900/50 rounded-b-xl">
        <Skeleton className="h-5 w-full bg-slate-800" />
      </div>
    </div>
  )
}
