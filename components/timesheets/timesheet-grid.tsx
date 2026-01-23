'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  TimesheetEntry,
  TimesheetEntryType,
  TIMESHEET_ENTRY_TYPE_LABELS,
} from '@/types/contracts'
import { Plus, Trash2, Clock, Save } from 'lucide-react'
import { format, eachDayOfInterval, isWeekend, parseISO } from 'date-fns'
import { nb } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface TimesheetGridProps {
  periodStart: string
  periodEnd: string
  entries: TimesheetEntry[]
  onChange: (entries: TimesheetEntry[]) => void
  readonly?: boolean
}

export function TimesheetGrid({
  periodStart,
  periodEnd,
  entries,
  onChange,
  readonly = false,
}: TimesheetGridProps) {
  // Generate all days in the period
  const days = useMemo(() => {
    const start = parseISO(periodStart)
    const end = parseISO(periodEnd)
    return eachDayOfInterval({ start, end })
  }, [periodStart, periodEnd])

  // Group entries by date
  const entriesByDate = useMemo(() => {
    const map = new Map<string, TimesheetEntry>()
    entries.forEach((entry) => {
      map.set(entry.date, entry)
    })
    return map
  }, [entries])

  const handleEntryChange = (
    date: string,
    field: keyof TimesheetEntry,
    value: string | number
  ) => {
    const existingEntry = entriesByDate.get(date)

    if (existingEntry) {
      const updated = entries.map((e) =>
        e.date === date ? { ...e, [field]: value } : e
      )
      onChange(updated)
    } else {
      // Create new entry
      const newEntry: TimesheetEntry = {
        date,
        hours: field === 'hours' ? (value as number) : 0,
        type: field === 'type' ? (value as TimesheetEntryType) : 'regular',
        description: field === 'description' ? (value as string) : undefined,
      }
      onChange([...entries, newEntry])
    }
  }

  const removeEntry = (date: string) => {
    onChange(entries.filter((e) => e.date !== date))
  }

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0)
  const totalDays = totalHours / 8

  const totalByType = useMemo(() => {
    const totals: Record<TimesheetEntryType, number> = {
      regular: 0,
      overtime: 0,
      holiday: 0,
      sick: 0,
      travel: 0,
    }
    entries.forEach((e) => {
      totals[e.type] += e.hours
    })
    return totals
  }, [entries])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timeregistrering
        </CardTitle>
        <div className="text-right">
          <p className="text-2xl font-bold">{totalHours.toFixed(1)} timer</p>
          <p className="text-sm text-muted-foreground">{totalDays.toFixed(1)} dager</p>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Dato</TableHead>
              <TableHead className="w-[100px]">Timer</TableHead>
              <TableHead className="w-[140px]">Type</TableHead>
              <TableHead>Beskrivelse</TableHead>
              {!readonly && <TableHead className="w-[50px]"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const entry = entriesByDate.get(dateStr)
              const weekend = isWeekend(day)

              return (
                <TableRow
                  key={dateStr}
                  className={cn(weekend && 'bg-muted/50')}
                >
                  <TableCell className="font-medium">
                    <div>
                      <p className="capitalize">
                        {format(day, 'EEEE', { locale: nb })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(day, 'dd.MM', { locale: nb })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {readonly ? (
                      <span>{entry?.hours || '-'}</span>
                    ) : (
                      <Input
                        type="number"
                        min={0}
                        max={24}
                        step={0.5}
                        value={entry?.hours || ''}
                        onChange={(e) =>
                          handleEntryChange(
                            dateStr,
                            'hours',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-20"
                        placeholder="0"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {readonly ? (
                      <span>
                        {entry?.type
                          ? TIMESHEET_ENTRY_TYPE_LABELS[entry.type]
                          : '-'}
                      </span>
                    ) : (
                      <Select
                        value={entry?.type || 'regular'}
                        onValueChange={(v) =>
                          handleEntryChange(dateStr, 'type', v)
                        }
                        disabled={!entry?.hours}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(TIMESHEET_ENTRY_TYPE_LABELS).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    {readonly ? (
                      <span>{entry?.description || '-'}</span>
                    ) : (
                      <Input
                        value={entry?.description || ''}
                        onChange={(e) =>
                          handleEntryChange(dateStr, 'description', e.target.value)
                        }
                        placeholder="Valgfri beskrivelse..."
                        disabled={!entry?.hours}
                      />
                    )}
                  </TableCell>
                  {!readonly && (
                    <TableCell>
                      {entry?.hours ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeEntry(dateStr)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : null}
                    </TableCell>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {/* Summary by type */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium mb-3">Oppsummering per type</h4>
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(TIMESHEET_ENTRY_TYPE_LABELS).map(([type, label]) => (
              <div key={type} className="text-center p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-lg font-bold">
                  {totalByType[type as TimesheetEntryType].toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">timer</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
