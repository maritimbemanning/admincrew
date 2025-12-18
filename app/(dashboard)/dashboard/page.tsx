'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, ClipboardList, FileCheck, Clock, AlertTriangle, Plus, Target } from 'lucide-react'
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Velkommen tilbake! Her er en oversikt over dagens status.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tilgjengelige kandidater</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.availableCandidates || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Klar for oppdrag
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Apne requests</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.openRequests || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.urgentRequests ? `${stats.urgentRequests} haster` : 'Ingen haster'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive oppdrag</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.activeAssignments || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.startingThisWeek ? `${stats.startingThisWeek} starter denne uken` : 'Ingen starter denne uken'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventende godkjenning</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.pendingApprovals || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Timer til godkjenning
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Krever oppmerksomhet
            </CardTitle>
            <CardDescription>Ting som trenger handling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {statsLoading ? (
              <>
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </>
            ) : (
              <>
                <button
                  className="flex items-center justify-between w-full hover:bg-muted p-1 rounded transition-colors"
                  onClick={() => handleQuickAction('/candidates?compliance=pending')}
                >
                  <span className="text-sm">Compliance-ko</span>
                  <Badge variant="secondary">{stats?.compliancePending || 0}</Badge>
                </button>
                <button
                  className="flex items-center justify-between w-full hover:bg-muted p-1 rounded transition-colors"
                  onClick={() => handleQuickAction('/candidates?certExpiring=30')}
                >
                  <span className="text-sm">Utlopende sertifikater (30 dager)</span>
                  <Badge variant="secondary">{stats?.expiringCertificates || 0}</Badge>
                </button>
                <button
                  className="flex items-center justify-between w-full hover:bg-muted p-1 rounded transition-colors"
                  onClick={() => handleQuickAction('/operations/requests?priority=urgent')}
                >
                  <span className="text-sm">Haste-requests</span>
                  <Badge variant={stats?.urgentRequests ? 'destructive' : 'secondary'}>
                    {stats?.urgentRequests || 0}
                  </Badge>
                </button>
                <button
                  className="flex items-center justify-between w-full hover:bg-muted p-1 rounded transition-colors"
                  onClick={() => handleQuickAction('/timesheets/approve')}
                >
                  <span className="text-sm">Timer til godkjenning</span>
                  <Badge variant="secondary">{stats?.pendingApprovals || 0}</Badge>
                </button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Siste aktivitet</CardTitle>
            <CardDescription>Nylige hendelser i systemet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityLoading ? (
              <>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </>
            ) : recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="text-sm">
                  <span className="font-medium">{activity.title}</span>
                  {activity.subtitle && (
                    <span className="text-muted-foreground"> {activity.subtitle}</span>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                      locale: nb,
                    })}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Ingen nylig aktivitet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Vanlige oppgaver</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button
              className="w-full text-left text-sm p-2 rounded-md hover:bg-muted transition-colors flex items-center gap-2"
              onClick={() => handleQuickAction('/candidates/new')}
            >
              <Plus className="h-4 w-4" />
              Ny kandidat
            </button>
            <button
              className="w-full text-left text-sm p-2 rounded-md hover:bg-muted transition-colors flex items-center gap-2"
              onClick={() => handleQuickAction('/operations/requests/new')}
            >
              <Plus className="h-4 w-4" />
              Ny request
            </button>
            <button
              className="w-full text-left text-sm p-2 rounded-md hover:bg-muted transition-colors flex items-center gap-2"
              onClick={() => handleQuickAction('/crm/contacts/new')}
            >
              <Plus className="h-4 w-4" />
              Ny kontakt
            </button>
            <button
              className="w-full text-left text-sm p-2 rounded-md hover:bg-muted transition-colors flex items-center gap-2"
              onClick={() => handleQuickAction('/operations/matching')}
            >
              <Target className="h-4 w-4" />
              Quick Match
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
