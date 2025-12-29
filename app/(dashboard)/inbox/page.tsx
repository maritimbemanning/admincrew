'use client'

import { useState } from 'react'
import {
  useJobApplications,
  useInterestLeads,
  useInboxStats,
  useMarkCandidateReviewed,
  useConvertInterestToCandidate,
  useBulkMarkCandidatesReviewed,
  useUpdateCandidateStatus,
  getCvSignedUrl,
  type InboxCandidate,
  type InboxInterest,
} from '@/hooks/use-inbox'
import { usePools, useBulkAddToPool } from '@/hooks/use-pools'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { 
  Inbox, 
  FileText, 
  Users, 
  Building2, 
  UserPlus, 
  Download, 
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Briefcase,
  Loader2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'
import Link from 'next/link'

export default function InboxPage() {
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useInboxStats()
  const { data: applications, isLoading: appsLoading, refetch: refetchApps } = useJobApplications()
  const { data: leads, isLoading: leadsLoading, refetch: refetchLeads } = useInterestLeads()
  
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set())
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  
  const markReviewed = useMarkCandidateReviewed()
  const convertLead = useConvertInterestToCandidate()
  const bulkMarkReviewed = useBulkMarkCandidatesReviewed()
  const updateStatus = useUpdateCandidateStatus()
  const { data: pools } = usePools()
  const addToPool = useBulkAddToPool()

  const handleRefresh = () => {
    refetchStats()
    refetchApps()
    refetchLeads()
    toast.success('Oppdatert!')
  }

  const handleMarkReviewed = async (app: InboxCandidate, poolId?: string) => {
    try {
      const result = await markReviewed.mutateAsync(app.id)

      // Legg til i pool hvis valgt
      if (poolId && result.candidateId) {
        await addToPool.mutateAsync({ poolId, candidateIds: [result.candidateId] })
      }

      toast.success(`${app.name} markert som vurdert${poolId ? ' + lagt i pool' : ''}`)
    } catch (error) {
      toast.error('Kunne ikke oppdatere kandidat')
    }
  }

  const handleConvertLead = async (lead: InboxInterest, poolId?: string) => {
    try {
      const result = await convertLead.mutateAsync(lead.id)

      // Legg til i pool hvis valgt
      if (poolId && result.candidateId) {
        await addToPool.mutateAsync({ poolId, candidateIds: [result.candidateId] })
      }

      if (result.isNew) {
        toast.success(`${lead.name} lagt til som kandidat!`)
      } else {
        toast.success(`${lead.name} koblet til eksisterende kandidat`)
      }
    } catch (error) {
      console.error('Convert error:', error)
      toast.error('Kunne ikke konvertere: ' + (error as Error).message)
    }
  }

  const handleBulkMarkReviewed = async () => {
    if (selectedApps.size === 0) return

    try {
      const result = await bulkMarkReviewed.mutateAsync(Array.from(selectedApps))
      toast.success(`Markert ${result.successful} av ${result.total} som vurdert`)
      setSelectedApps(new Set())
    } catch (error) {
      toast.error('Noe gikk galt')
    }
  }

  const handleReject = async (app: InboxCandidate) => {
    try {
      await updateStatus.mutateAsync({ id: app.id, status: 'avslått', pipeline_stage: 'avslått' })
      toast.success('Kandidat avslått')
    } catch (error) {
      toast.error('Kunne ikke avslå kandidat')
    }
  }

  // pipeline_stage = 'ny' means new candidates
  const newApps = applications?.filter(a => a.pipeline_stage === 'ny') || []
  const reviewedApps = applications?.filter(a => a.pipeline_stage !== 'ny') || []
  // pipeline_status = 'new' means new interest leads
  const newLeads = leads?.filter(l => l.pipeline_status === 'new') || []

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Inbox className="h-8 w-8" />
            Innboks
          </h1>
          <p className="text-muted-foreground mt-1">
            Innkommende søknader og leads fra bluecrew.no
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Oppdater
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Nye søknader"
          value={stats?.newApplications || 0}
          icon={FileText}
          color="blue"
          loading={statsLoading}
        />
        <StatsCard
          title="Nye leads"
          value={stats?.newLeads || 0}
          icon={Users}
          color="green"
          loading={statsLoading}
        />
        <StatsCard
          title="Bemanningsbehov"
          value={stats?.newStaffingNeeds || 0}
          icon={Building2}
          color="purple"
          loading={statsLoading}
        />
        <StatsCard
          title="Totalt ubehandlet"
          value={stats?.total || 0}
          icon={Inbox}
          color="orange"
          loading={statsLoading}
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="applications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="applications" className="gap-2">
            <FileText className="h-4 w-4" />
            Jobbsøknader
            {newApps.length > 0 && (
              <Badge variant="destructive" className="ml-1">{newApps.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="leads" className="gap-2">
            <Users className="h-4 w-4" />
            Interesseskjema
            {newLeads.length > 0 && (
              <Badge variant="destructive" className="ml-1">{newLeads.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Job Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          {/* Bulk Actions */}
          {selectedApps.size > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">{selectedApps.size} valgt</span>
              <Button size="sm" onClick={handleBulkMarkReviewed} disabled={bulkMarkReviewed.isPending}>
                {bulkMarkReviewed.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Marker som vurdert
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedApps(new Set())}>
                Avmarker
              </Button>
            </div>
          )}

          {appsLoading ? (
            <ApplicationsSkeleton />
          ) : applications?.length === 0 ? (
            <EmptyState 
              icon={FileText} 
              title="Ingen søknader" 
              description="Nye jobbsøknader fra bluecrew.no vil vises her"
            />
          ) : (
            <div className="space-y-3">
              {/* New Applications */}
              {newApps.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Nye søknader ({newApps.length})
                  </h3>
                  <div className="space-y-2">
                    {newApps.map(app => (
                      <ApplicationCard
                        key={app.id}
                        application={app}
                        selected={selectedApps.has(app.id)}
                        onSelect={(checked) => {
                          const next = new Set(selectedApps)
                          checked ? next.add(app.id) : next.delete(app.id)
                          setSelectedApps(next)
                        }}
                        onConvert={(poolId) => handleMarkReviewed(app, poolId)}
                        onReject={() => handleReject(app)}
                        isConverting={markReviewed.isPending}
                        pools={pools?.filter(p => !p.is_system) || []}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Reviewed Applications */}
              {reviewedApps.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 mt-6">
                    Behandlet ({reviewedApps.length})
                  </h3>
                  <div className="space-y-2 opacity-60">
                    {reviewedApps.slice(0, 10).map(app => (
                      <ApplicationCard
                        key={app.id}
                        application={app}
                        selected={false}
                        onSelect={() => {}}
                        onConvert={(poolId) => handleMarkReviewed(app, poolId)}
                        onReject={() => handleReject(app)}
                        isConverting={markReviewed.isPending}
                        compact
                        pools={pools?.filter(p => !p.is_system) || []}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Interest Leads Tab */}
        <TabsContent value="leads" className="space-y-4">
          {leadsLoading ? (
            <ApplicationsSkeleton />
          ) : leads?.length === 0 ? (
            <EmptyState 
              icon={Users} 
              title="Ingen leads" 
              description="Nye interesseskjemaer fra bluecrew.no vil vises her"
            />
          ) : (
            <div className="space-y-2">
              {leads?.map(lead => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onConvert={(poolId) => handleConvertLead(lead, poolId)}
                  isConverting={convertLead.isPending}
                  pools={pools?.filter(p => !p.is_system) || []}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════

function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  loading 
}: { 
  title: string
  value: number
  icon: React.ElementType
  color: 'blue' | 'green' | 'purple' | 'orange'
  loading: boolean
}) {
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
          <div>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-3xl font-bold">{value}</p>
            )}
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ApplicationCard({
  application: app,
  selected,
  onSelect,
  onConvert,
  onReject,
  isConverting,
  compact = false,
  pools = [],
}: {
  application: InboxCandidate
  selected: boolean
  onSelect: (checked: boolean) => void
  onConvert: (poolId?: string) => void
  onReject: () => void
  isConverting: boolean
  compact?: boolean
  pools?: Array<{ id: string; name: string; color: string }>
}) {
  const isNew = app.pipeline_stage === 'ny'
  const statusColors: Record<string, string> = {
    pending: 'bg-blue-500',
    godkjent: 'bg-green-500',
    avslått: 'bg-red-500',
    ansatt: 'bg-emerald-500',
  }

  return (
    <Card className={compact ? 'p-3' : ''}>
      <CardContent className={compact ? 'p-0' : 'pt-4'}>
        <div className="flex items-start gap-3">
          {!compact && (
            <Checkbox
              checked={selected}
              onCheckedChange={onSelect}
              className="mt-1"
            />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${statusColors[app.status] || 'bg-blue-500'}`} />
              <h4 className="font-medium truncate">{app.name}</h4>
              {!isNew && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Vurdert
                </Badge>
              )}
            </div>

            {!compact && (
              <>
                <p className="text-sm text-muted-foreground mt-1">
                  Rolle: <span className="text-foreground">{app.rolle || 'Ikke angitt'}</span>
                  {app.erfaring && <span className="ml-2">• {app.erfaring} års erfaring</span>}
                  {app.fylke && <span className="ml-2">• {app.fylke}</span>}
                </p>

                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {app.email}
                  </span>
                  {app.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {app.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(app.created_at), { addSuffix: true, locale: nb })}
                  </span>
                </div>
              </>
            )}
          </div>

          {!compact && (
            <div className="flex items-center gap-2 shrink-0">
              {app.cv_key && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const url = await getCvSignedUrl(app.cv_key!)
                    if (url) window.open(url, '_blank')
                    else toast.error('Kunne ikke laste ned CV')
                  }}
                >
                  <Download className="h-4 w-4 mr-1" />
                  CV
                </Button>
              )}

              {isNew ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" disabled={isConverting}>
                        {isConverting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Vurder
                          </>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onConvert()}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Marker som vurdert
                      </DropdownMenuItem>
                      {pools.length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Vurder + legg i pool:</DropdownMenuLabel>
                          {pools.slice(0, 10).map(pool => (
                            <DropdownMenuItem key={pool.id} onClick={() => onConvert(pool.id)}>
                              <span
                                className="w-2 h-2 rounded-full mr-2"
                                style={{ backgroundColor: pool.color }}
                              />
                              {pool.name}
                            </DropdownMenuItem>
                          ))}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onReject}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/candidates/${app.id}`}>
                    <Eye className="h-4 w-4 mr-1" />
                    Se kandidat
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function LeadCard({
  lead,
  onConvert,
  isConverting,
  pools = [],
}: {
  lead: InboxInterest
  onConvert: (poolId?: string) => void
  isConverting: boolean
  pools?: Array<{ id: string; name: string; color: string }>
}) {
  const isConverted = lead.pipeline_status === 'converted' || lead.status === 'konvertert'

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{lead.name}</h4>
              {lead.role && (
                <Badge variant="secondary" className="text-xs">
                  {lead.role}
                </Badge>
              )}
              {isConverted && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Konvertert
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {lead.email}
              </span>
              {lead.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {lead.phone}
                </span>
              )}
              {lead.experience && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {lead.experience} års erfaring
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: nb })}
              </span>
            </div>

            {lead.notes && (
              <p className="text-sm mt-2 text-muted-foreground">
                {lead.notes}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {lead.cv_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const url = await getCvSignedUrl(lead.cv_url!)
                  if (url) window.open(url, '_blank')
                  else toast.error('Kunne ikke laste ned CV')
                }}
              >
                <Download className="h-4 w-4 mr-1" />
                CV
              </Button>
            )}

            {!isConverted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" disabled={isConverting}>
                    {isConverting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Konverter
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onConvert()}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Konverter til kandidat
                  </DropdownMenuItem>
                  {pools.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Konverter + legg i pool:</DropdownMenuLabel>
                      {pools.slice(0, 10).map(pool => (
                        <DropdownMenuItem key={pool.id} onClick={() => onConvert(pool.id)}>
                          <span
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: pool.color }}
                          />
                          {pool.name}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  )
}

function ApplicationsSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-4 w-4" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
