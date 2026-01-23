'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Check,
  Clock,
  Plus,
  Save,
  Send,
  Trash2
} from 'lucide-react'

// Mock timesheet data
const timesheets = [
  {
    id: '1',
    weekNumber: 50,
    year: 2024,
    status: 'draft',
    totalHours: 40,
    assignment: {
      id: '1',
      client: 'Equinor ASA',
      role: 'Senior Prosjektleder',
    },
    entries: [
      { date: '2024-12-09', hours: 8, description: 'Prosjektmøte og planlegging' },
      { date: '2024-12-10', hours: 8, description: 'Dokumentasjon og oppfølging' },
      { date: '2024-12-11', hours: 8, description: 'Statusrapportering' },
      { date: '2024-12-12', hours: 8, description: 'Sprint review' },
      { date: '2024-12-13', hours: 8, description: 'Sprint retrospektiv' },
    ],
  },
  {
    id: '2',
    weekNumber: 49,
    year: 2024,
    status: 'approved',
    totalHours: 37.5,
    assignment: {
      id: '1',
      client: 'Equinor ASA',
      role: 'Senior Prosjektleder',
    },
    entries: [
      { date: '2024-12-02', hours: 7.5, description: 'Prosjektmøte' },
      { date: '2024-12-03', hours: 7.5, description: 'Dokumentasjon' },
      { date: '2024-12-04', hours: 7.5, description: 'Oppfølging' },
      { date: '2024-12-05', hours: 7.5, description: 'Statusmøte' },
      { date: '2024-12-06', hours: 7.5, description: 'Planlegging' },
    ],
  },
  {
    id: '3',
    weekNumber: 48,
    year: 2024,
    status: 'submitted',
    totalHours: 40,
    assignment: {
      id: '1',
      client: 'Equinor ASA',
      role: 'Senior Prosjektleder',
    },
    entries: [],
  },
]

function getStatusBadge(status: string) {
  switch (status) {
    case 'draft':
      return <Badge variant="outline">Utkast</Badge>
    case 'submitted':
      return <Badge className="bg-blue-100 text-blue-800">Innsendt</Badge>
    case 'approved':
      return <Badge className="bg-green-100 text-green-800">Godkjent</Badge>
    case 'rejected':
      return <Badge variant="destructive">Avvist</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default function EmployeeTimesheetsPage() {
  const [activeTimesheet, setActiveTimesheet] = React.useState(timesheets[0])
  const [entries, setEntries] = React.useState(activeTimesheet.entries)

  const weekdays = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag']

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Timelister</h1>
        <p className="text-muted-foreground">
          Registrer og send inn timelister for dine oppdrag.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Timesheet List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Mine timelister</h2>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Ny
            </Button>
          </div>

          <div className="space-y-2">
            {timesheets.map((ts) => (
              <Card
                key={ts.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  activeTimesheet.id === ts.id ? 'border-primary' : ''
                }`}
                onClick={() => {
                  setActiveTimesheet(ts)
                  setEntries(ts.entries)
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Uke {ts.weekNumber}</p>
                      <p className="text-sm text-muted-foreground">{ts.year}</p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(ts.status)}
                      <p className="text-sm text-muted-foreground mt-1">
                        {ts.totalHours} timer
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Timesheet Editor */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    Uke {activeTimesheet.weekNumber}, {activeTimesheet.year}
                  </CardTitle>
                  <CardDescription>
                    {activeTimesheet.assignment.client} - {activeTimesheet.assignment.role}
                  </CardDescription>
                </div>
                {getStatusBadge(activeTimesheet.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {activeTimesheet.status === 'draft' ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dato</TableHead>
                        <TableHead className="w-24">Timer</TableHead>
                        <TableHead>Beskrivelse</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="text-sm">
                              <p className="font-medium">{weekdays[index]}</p>
                              <p className="text-muted-foreground">
                                {new Date(entry.date).toLocaleDateString('nb-NO')}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.5"
                              min="0"
                              max="24"
                              value={entry.hours}
                              onChange={(e) => {
                                const newEntries = [...entries]
                                newEntries[index].hours = parseFloat(e.target.value) || 0
                                setEntries(newEntries)
                              }}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={entry.description}
                              onChange={(e) => {
                                const newEntries = [...entries]
                                newEntries[index].description = e.target.value
                                setEntries(newEntries)
                              }}
                              placeholder="Hva jobbet du med?"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newEntries = entries.filter((_, i) => i !== index)
                                setEntries(newEntries)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold">
                        Totalt: {entries.reduce((sum, e) => sum + e.hours, 0)} timer
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline">
                        <Save className="mr-2 h-4 w-4" />
                        Lagre utkast
                      </Button>
                      <Button>
                        <Send className="mr-2 h-4 w-4" />
                        Send inn
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dato</TableHead>
                        <TableHead>Timer</TableHead>
                        <TableHead>Beskrivelse</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeTimesheet.entries.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {new Date(entry.date).toLocaleDateString('nb-NO', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            })}
                          </TableCell>
                          <TableCell>{entry.hours} timer</TableCell>
                          <TableCell>{entry.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold">
                      Totalt: {activeTimesheet.totalHours} timer
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
