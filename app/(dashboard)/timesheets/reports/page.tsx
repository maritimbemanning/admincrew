'use client'

import { useState } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateRangePicker } from '@/components/shared/date-range-picker'
import { MetricCard } from '@/components/shared/metric-card'
import {
  Clock,
  Download,
  FileSpreadsheet,
  TrendingUp,
  Users,
  Calendar,
  Briefcase,
  Filter,
} from 'lucide-react'
import { addDays, startOfMonth, endOfMonth, format } from 'date-fns'
import { nb } from 'date-fns/locale'

// Mock data
const summaryData = {
  totalHours: 4567.5,
  totalHoursChange: 12.5,
  averageHoursPerDay: 7.8,
  employeeCount: 45,
  projectCount: 12,
  overtimeHours: 234,
  overtimePercentage: 5.1,
}

const projectBreakdown = [
  { name: 'Hurtigruten - MS Nordlys', hours: 1240, percentage: 27.1 },
  { name: 'Havila - MS Polaris', hours: 980, percentage: 21.4 },
  { name: 'Fjord Line - MS Bergensfjord', hours: 756, percentage: 16.5 },
  { name: 'Kystverket - Vedlikehold', hours: 543, percentage: 11.9 },
  { name: 'Andre oppdrag', hours: 1048.5, percentage: 23.1 },
]

const employeeRanking = [
  { name: 'Ole Hansen', hours: 168, assignments: 3 },
  { name: 'Kari Nordmann', hours: 156, assignments: 2 },
  { name: 'Per Olsen', hours: 148, assignments: 2 },
  { name: 'Maria Eriksen', hours: 144, assignments: 2 },
  { name: 'Anders Berg', hours: 140, assignments: 1 },
]

export default function TimesheetReportsPage() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  })
  const [groupBy, setGroupBy] = useState<string>('project')

  const handleExport = (format: 'excel' | 'csv' | 'pdf') => {
    // TODO: Implement export
    console.log('Export:', format)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Timerapporter</h1>
          <p className="text-muted-foreground">
            Analysér og eksportér timedata
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Eksport Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Eksport PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtre:</span>
            </div>
            
            <DateRangePicker
              value={dateRange}
              onChange={(range) => range && setDateRange(range as { from: Date; to: Date })}
            />

            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Grupper etter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project">Prosjekt</SelectItem>
                <SelectItem value="employee">Ansatt</SelectItem>
                <SelectItem value="week">Uke</SelectItem>
                <SelectItem value="month">Måned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Totale timer"
          value={summaryData.totalHours.toLocaleString('nb-NO')}
          icon={Clock}
          trend={{ value: summaryData.totalHoursChange, label: 'vs forrige periode' }}
        />
        <MetricCard
          title="Snitt per dag"
          value={summaryData.averageHoursPerDay.toFixed(1)}
          icon={TrendingUp}
          subtitle="timer"
        />
        <MetricCard
          title="Aktive ansatte"
          value={summaryData.employeeCount.toString()}
          icon={Users}
        />
        <MetricCard
          title="Overtid"
          value={`${summaryData.overtimeHours}t`}
          icon={Calendar}
          trend={{ 
            value: summaryData.overtimePercentage, 
            label: 'av total'
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Project Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Timer per prosjekt
            </CardTitle>
            <CardDescription>
              Fordeling av timer på aktive prosjekter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectBreakdown.map((project, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate mr-4">
                      {project.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm tabular-nums">
                        {project.hours.toLocaleString('nb-NO')}t
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {project.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${project.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Employee Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Topp ansatte
            </CardTitle>
            <CardDescription>
              Ansatte med flest timer i perioden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employeeRanking.map((employee, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{employee.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {employee.assignments} oppdrag
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{employee.hours}t</p>
                    <p className="text-xs text-muted-foreground">
                      {(employee.hours / 22).toFixed(1)}t/dag
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detaljert oversikt</CardTitle>
          <CardDescription>
            Alle registrerte timer for valgt periode
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Uke</th>
                  <th className="text-left p-3 font-medium">Man</th>
                  <th className="text-left p-3 font-medium">Tir</th>
                  <th className="text-left p-3 font-medium">Ons</th>
                  <th className="text-left p-3 font-medium">Tor</th>
                  <th className="text-left p-3 font-medium">Fre</th>
                  <th className="text-left p-3 font-medium">Lør</th>
                  <th className="text-left p-3 font-medium">Søn</th>
                  <th className="text-right p-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {[2, 3, 4, 5].map((week) => (
                  <tr key={week} className="border-b">
                    <td className="p-3 font-medium">Uke {week}</td>
                    <td className="p-3 text-muted-foreground">8.0</td>
                    <td className="p-3 text-muted-foreground">7.5</td>
                    <td className="p-3 text-muted-foreground">8.0</td>
                    <td className="p-3 text-muted-foreground">8.0</td>
                    <td className="p-3 text-muted-foreground">7.0</td>
                    <td className="p-3 text-muted-foreground">-</td>
                    <td className="p-3 text-muted-foreground">-</td>
                    <td className="p-3 text-right font-medium">38.5</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50">
                  <td className="p-3 font-bold" colSpan={8}>Totalt</td>
                  <td className="p-3 text-right font-bold">154.0t</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
