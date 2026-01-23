'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format, addWeeks, subWeeks, addMonths, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { nb } from 'date-fns/locale'
import { getWeekPeriod, getMonthPeriod } from '@/hooks/use-timesheets'

type PeriodType = 'week' | 'month'

interface PeriodSelectorProps {
  periodType: PeriodType
  onPeriodTypeChange: (type: PeriodType) => void
  currentDate: Date
  onDateChange: (date: Date) => void
  periodStart: string
  periodEnd: string
}

export function PeriodSelector({
  periodType,
  onPeriodTypeChange,
  currentDate,
  onDateChange,
  periodStart,
  periodEnd,
}: PeriodSelectorProps) {
  const goToPrevious = () => {
    if (periodType === 'week') {
      onDateChange(subWeeks(currentDate, 1))
    } else {
      onDateChange(subMonths(currentDate, 1))
    }
  }

  const goToNext = () => {
    if (periodType === 'week') {
      onDateChange(addWeeks(currentDate, 1))
    } else {
      onDateChange(addMonths(currentDate, 1))
    }
  }

  const goToToday = () => {
    onDateChange(new Date())
  }

  const getPeriodLabel = () => {
    if (periodType === 'week') {
      const start = new Date(periodStart)
      const end = new Date(periodEnd)
      return `${format(start, 'dd.', { locale: nb })} - ${format(end, 'dd. MMMM yyyy', { locale: nb })}`
    } else {
      return format(currentDate, 'MMMM yyyy', { locale: nb })
    }
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Select value={periodType} onValueChange={(v) => onPeriodTypeChange(v as PeriodType)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Uke</SelectItem>
            <SelectItem value="month">Måned</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={goToToday}>
          <Calendar className="h-4 w-4 mr-2" />
          I dag
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={goToPrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-lg font-medium min-w-[200px] text-center capitalize">
          {getPeriodLabel()}
        </span>

        <Button variant="outline" size="icon" onClick={goToNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="w-[160px]" /> {/* Spacer for alignment */}
    </div>
  )
}

// Hook for managing period state
import { useState, useMemo } from 'react'

export function usePeriodSelector() {
  const [periodType, setPeriodType] = useState<PeriodType>('week')
  const [currentDate, setCurrentDate] = useState(new Date())

  const period = useMemo(() => {
    if (periodType === 'week') {
      return getWeekPeriod(currentDate)
    } else {
      return getMonthPeriod(currentDate)
    }
  }, [periodType, currentDate])

  return {
    periodType,
    setPeriodType,
    currentDate,
    setCurrentDate,
    periodStart: period.start,
    periodEnd: period.end,
  }
}
