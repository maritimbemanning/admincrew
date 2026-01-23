'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  Building2, 
  Calendar,
  Clock,
  MapPin,
  User,
  FileText
} from 'lucide-react'
import Link from 'next/link'

// Mock assignments data
const assignments = [
  {
    id: '1',
    status: 'active',
    client: {
      name: 'Equinor ASA',
      logo: null,
    },
    role: 'Senior Prosjektleder',
    description: 'Prosjektledelse for digitaliseringsinitiativ innen bore- og brønnoperasjoner',
    location: 'Stavanger',
    startDate: '2024-01-15',
    endDate: '2024-12-31',
    hourlyRate: 1250,
    hoursUsed: 1240,
    hoursTotal: 1600,
    contactPerson: 'Kari Nordmann',
    contactEmail: 'kari.nordmann@equinor.com',
  },
  {
    id: '2',
    status: 'completed',
    client: {
      name: 'DNB ASA',
      logo: null,
    },
    role: 'Scrum Master',
    description: 'Fasilitere agile prosesser for utviklingsteam innen bedriftsmarked',
    location: 'Oslo',
    startDate: '2023-01-10',
    endDate: '2023-12-20',
    hourlyRate: 1100,
    hoursUsed: 1500,
    hoursTotal: 1500,
    contactPerson: 'Ole Hansen',
    contactEmail: 'ole.hansen@dnb.no',
  },
]

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
    case 'completed':
      return <Badge variant="secondary">Fullført</Badge>
    case 'upcoming':
      return <Badge className="bg-blue-100 text-blue-800">Kommende</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function EmployeeAssignmentsPage() {
  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mine oppdrag</h1>
        <p className="text-muted-foreground">
          Oversikt over dine nåværende og tidligere oppdrag.
        </p>
      </div>

      <div className="space-y-6">
        {assignments.map((assignment) => (
          <Card key={assignment.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{assignment.role}</CardTitle>
                    {getStatusBadge(assignment.status)}
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {assignment.client.name}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">{assignment.description}</p>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="text-muted-foreground">Periode</p>
                    <p>
                      {new Date(assignment.startDate).toLocaleDateString('nb-NO')} -{' '}
                      {new Date(assignment.endDate).toLocaleDateString('nb-NO')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="text-muted-foreground">Lokasjon</p>
                    <p>{assignment.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="text-muted-foreground">Timerate</p>
                    <p>{assignment.hourlyRate.toLocaleString('nb-NO')} kr</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="text-muted-foreground">Kontaktperson</p>
                    <p>{assignment.contactPerson}</p>
                  </div>
                </div>
              </div>

              {assignment.status === 'active' && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Timer brukt</span>
                      <span className="font-medium">
                        {assignment.hoursUsed} / {assignment.hoursTotal} timer
                      </span>
                    </div>
                    <Progress 
                      value={(assignment.hoursUsed / assignment.hoursTotal) * 100} 
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href={`/employee/timesheets?assignment=${assignment.id}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    Se timelister
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/employee/contracts?assignment=${assignment.id}`}>
                    Vis kontrakt
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
