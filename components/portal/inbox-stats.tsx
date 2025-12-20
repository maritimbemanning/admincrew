// components/portal/inbox-stats.tsx
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { 
  Users, 
  Briefcase, 
  FileUser, 
  MessageSquare,
  Clock
} from 'lucide-react'
import { 
  useJobApplicationStats, 
  useInterestLeadStats, 
  useStaffingNeedStats, 
  usePortalContactStats 
} from '@/hooks'

interface StatCardProps {
  title: string
  value: number
  icon: React.ReactNode
  description?: string
  loading?: boolean
}

function StatCard({ title, value, icon, description, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? (
              <div className="h-8 w-16 animate-pulse bg-muted rounded" />
            ) : (
              <p className="text-2xl font-bold">{value}</p>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function InboxStats() {
  const { data: appStats, isLoading: appLoading } = useJobApplicationStats()
  const { data: leadStats, isLoading: leadLoading } = useInterestLeadStats()
  const { data: needStats, isLoading: needLoading } = useStaffingNeedStats()
  const { data: contactStats, isLoading: contactLoading } = usePortalContactStats()

  // NB: JobApplications bruker 'pending' som default status, ikke 'new'
  const totalNew = 
    (appStats?.pending || 0) + 
    (leadStats?.new || 0) + 
    (needStats?.new || 0) + 
    (contactStats?.new || 0)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Nye totalt"
        value={totalNew}
        icon={<Clock className="h-5 w-5" />}
        description="Ubehandlet"
        loading={appLoading || leadLoading || needLoading || contactLoading}
      />
      <StatCard
        title="Jobbsøknader"
        value={appStats?.pending || 0}
        icon={<FileUser className="h-5 w-5" />}
        description={`${appStats?.total || 0} totalt`}
        loading={appLoading}
      />
      <StatCard
        title="Interesse-leads"
        value={leadStats?.new || 0}
        icon={<Users className="h-5 w-5" />}
        description={`${leadStats?.total || 0} totalt`}
        loading={leadLoading}
      />
      <StatCard
        title="Bemanningsbehov"
        value={needStats?.new || 0}
        icon={<Briefcase className="h-5 w-5" />}
        description={`${needStats?.total || 0} totalt`}
        loading={needLoading}
      />
      <StatCard
        title="Kontaktskjema"
        value={contactStats?.new || 0}
        icon={<MessageSquare className="h-5 w-5" />}
        description={`${contactStats?.total || 0} totalt`}
        loading={contactLoading}
      />
    </div>
  )
}
