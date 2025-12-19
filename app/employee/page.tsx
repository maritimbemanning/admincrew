'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/shared'
import { 
  Briefcase, 
  Clock, 
  FileText, 
  Calendar,
  ChevronRight,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

// Mock data for employee dashboard
const currentAssignment = {
  id: '1',
  client: 'Equinor ASA',
  role: 'Senior Prosjektleder',
  startDate: '2024-01-15',
  endDate: '2024-12-31',
  hoursThisMonth: 152,
  hoursTotal: 1240,
}

const pendingTimesheets = [
  { id: '1', period: 'Uke 48', status: 'draft', hours: 40 },
  { id: '2', period: 'Uke 49', status: 'draft', hours: 37.5 },
]

const pendingDocuments = [
  { id: '1', name: 'HMS-kurs sertifikat', expiresAt: '2024-03-15', type: 'certification' },
  { id: '2', name: 'Sikkerhetsklarering', expiresAt: '2024-02-28', type: 'clearance' },
]

const upcomingEvents = [
  { id: '1', title: 'Prosjektmøte', date: '2024-12-16', time: '10:00' },
  { id: '2', title: 'Statusrapport deadline', date: '2024-12-20', time: '16:00' },
]

export default function EmployeeDashboardPage() {
  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Velkommen tilbake!</h1>
        <p className="text-muted-foreground">
          Her er en oversikt over dine oppdrag og oppgaver.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Timer denne måneden"
          value={currentAssignment.hoursThisMonth}
          subtitle="av 160 budsjettert"
          icon={Clock}
        />
        <MetricCard
          title="Timer totalt"
          value={currentAssignment.hoursTotal}
          subtitle="på aktivt oppdrag"
          icon={Briefcase}
        />
        <MetricCard
          title="Ventende timelister"
          value={pendingTimesheets.length}
          subtitle="må sendes inn"
          icon={FileText}
        />
        <MetricCard
          title="Dokumenter"
          value={pendingDocuments.length}
          subtitle="utløper snart"
          icon={AlertCircle}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Assignment */}
        <Card>
          <CardHeader>
            <CardTitle>Aktivt oppdrag</CardTitle>
            <CardDescription>Ditt nåværende oppdrag</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{currentAssignment.role}</h3>
                <p className="text-muted-foreground">{currentAssignment.client}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Start:</span>{' '}
                  {new Date(currentAssignment.startDate).toLocaleDateString('nb-NO')}
                </div>
                <div>
                  <span className="text-muted-foreground">Slutt:</span>{' '}
                  {new Date(currentAssignment.endDate).toLocaleDateString('nb-NO')}
                </div>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/employee/assignments">
                  Se detaljer
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pending Timesheets */}
        <Card>
          <CardHeader>
            <CardTitle>Timelister</CardTitle>
            <CardDescription>Timelister som venter på innsending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTimesheets.map((timesheet) => (
                <div
                  key={timesheet.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{timesheet.period}</p>
                    <p className="text-sm text-muted-foreground">{timesheet.hours} timer</p>
                  </div>
                  <Badge variant="outline">Utkast</Badge>
                </div>
              ))}
              <Button asChild className="w-full">
                <Link href="/employee/timesheets">
                  Gå til timelister
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Expiring Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Dokumenter som utløper</CardTitle>
            <CardDescription>Oppdater disse snart</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Utløper {new Date(doc.expiresAt).toLocaleDateString('nb-NO')}
                    </p>
                  </div>
                  <Badge variant="destructive">Oppdater</Badge>
                </div>
              ))}
              <Button asChild variant="outline" className="w-full">
                <Link href="/employee/documents">
                  Se alle dokumenter
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Kommende hendelser</CardTitle>
            <CardDescription>Møter og frister</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-4 p-3 border rounded-lg"
                >
                  <Calendar className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.date).toLocaleDateString('nb-NO')} kl. {event.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
