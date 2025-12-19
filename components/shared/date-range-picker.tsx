'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DateRangePickerProps {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  numberOfMonths?: number
  align?: 'start' | 'center' | 'end'
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Velg datoer',
  className,
  disabled = false,
  numberOfMonths = 2,
  align = 'start',
}: DateRangePickerProps) {
  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, 'd. MMM yyyy', { locale: nb })} -{' '}
                  {format(value.to, 'd. MMM yyyy', { locale: nb })}
                </>
              ) : (
                format(value.from, 'd. MMM yyyy', { locale: nb })
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={onChange}
            numberOfMonths={numberOfMonths}
            locale={nb}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
