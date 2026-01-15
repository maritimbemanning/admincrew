'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, ClipboardList, FileCheck, Clock, AlertTriangle, Plus, Target, ArrowRight, TrendingUp } from 'lucide-react'
import { useDashboardStats, useRecentActivity } from '@/hooks/use-dashboard-stats'
import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'

export default function DashboardPage() {
  const router = useRouter()
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity()

  const handleQuickAction = (path: string) => {
    router.push(path)
  }

  return (
    <div className="space-y-10">
      {/* Hero Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-medium tracking-tight">
          Velkommen tilbake
        </h1>
        <p className="text-lg text-muted-foreground">
          Her er en oversikt over dagens <span className="text-accent-gold">operasjoner</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-gold-500/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tilgjengelige kandidater</CardTitle>
            <div className="p-2 bg-gold-500/10 rounded-lg">
              <Users className="h-5 w-5 text-gold-500" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <>
                <div className="text-4xl font-medium tracking-tight">{stats?.availableCandidates || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Verifiserte og klare for oppdrag
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-navy-700/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Åpne requests</CardTitle>
            <div className="p-2 bg-navy-700/10 rounded-lg">
              <ClipboardList className="h-5 w-5 text-navy-700 dark:text-cream-100" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <>
                <div className="text-4xl font-medium tracking-tight">{stats?.openRequests || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats?.urgentRequests ? (
                    <span className="text-warning">{stats.urgentRequests} haster</span>
                  ) : (
                    'Ingen haster'
                  )}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-success/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktive oppdrag</CardTitle>
            <div className="p-2 bg-success/10 rounded-lg">
              <FileCheck className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <>
                <div className="text-4xl font-medium tracking-tight">{stats?.activeAssignments || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats?.startingThisWeek ? `${stats.startingThisWeek} starter denne uken` : 'Pågående leveranser'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-warning/10 to-transparent rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ventende godkjenning</CardTitle>
            <div className="p-2 bg-warning/10 rounded-lg">
              <Clock className="h-5 w-5 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              <>
                <div className="text-4xl font-medium tracking-tight">{stats?.pendingApprovals || 0}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Timer til godkjenning
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Attention Required */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <CardTitle className="text-lg">Krever oppmerksomhet</CardTitle>
                <CardDescription>Ting som trenger handling</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {statsLoading ? (
              <>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </>
            ) : (
              <>
                <button
                  className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors group"
                  onClick={() => handleQuickAction('/candidates?compliance=pending')}
                >
                  <span className="text-sm font-medium">Compliance-kø</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning">{stats?.compliancePending || 0}</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
                <button
                  className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors group"
                  onClick={() => handleQuickAction('/candidates?certExpiring=30')}
                >
                  <span className="text-sm font-medium">Utløpende sertifikater (30 dager)</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{stats?.expiringCertificates || 0}</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
                <button
                  className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors group"
                  onClick={() => handleQuickAction('/operations/requests?priority=urgent')}
                >
                  <span className="text-sm font-medium">Haste-requests</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={stats?.urgentRequests ? 'destructive' : 'secondary'}>
                      {stats?.urgentRequests || 0}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
                <button
                  className="flex items-center justify-between w-full p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors group"
                  onClick={() => handleQuickAction('/timesheets/approve')}
                >
                  <span className="text-sm font-medium">Timer til godkjenning</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{stats?.pendingApprovals || 0}</Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-navy-700/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-navy-700 dark:text-cream-100" />
              </div>
              <div>
                <CardTitle className="text-lg">Siste aktivitet</CardTitle>
                <CardDescription>Nylige hendelser i systemet</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activityLoading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="p-3 rounded-xl bg-slate-50 dark:bg-navy-800/50">
                  <p className="text-sm font-medium">{activity.title}</p>
                  {activity.subtitle && (
                    <p className="text-sm text-muted-foreground">{activity.subtitle}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                      locale: nb,
                    })}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground p-3">Ingen nylig aktivitet</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gold-500/10 rounded-lg">
                <Target className="h-5 w-5 text-gold-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Hurtighandlinger</CardTitle>
                <CardDescription>Vanlige oppgaver</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start h-12 text-left"
              onClick={() => handleQuickAction('/candidates/new')}
            >
              <Plus className="h-4 w-4 mr-3" />
              Ny kandidat
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-12 text-left"
              onClick={() => handleQuickAction('/operations/requests/new')}
            >
              <Plus className="h-4 w-4 mr-3" />
              Ny request
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-12 text-left"
              onClick={() => handleQuickAction('/crm/contacts/new')}
            >
              <Plus className="h-4 w-4 mr-3" />
              Ny kontakt
            </Button>
            <Button
              variant="gold"
              className="w-full justify-start h-12 text-left mt-2"
              onClick={() => handleQuickAction('/operations/matching')}
            >
              <Target className="h-4 w-4 mr-3" />
              Quick Match
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
