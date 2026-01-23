'use client'

import * as React from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  value: number | null | undefined
  max?: number
  size?: 'sm' | 'md' | 'lg'
  onChange?: (value: number) => void
  readonly?: boolean
  className?: string
}

export function RatingStars({
  value,
  max = 5,
  size = 'md',
  onChange,
  readonly = false,
  className,
}: RatingStarsProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null)

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const gapClasses = {
    sm: 'gap-0.5',
    md: 'gap-1',
    lg: 'gap-1.5',
  }

  const displayValue = hoverValue ?? value ?? 0

  return (
    <div
      className={cn(
        'flex items-center',
        gapClasses[size],
        className
      )}
      onMouseLeave={() => !readonly && setHoverValue(null)}
    >
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1
        const isFilled = starValue <= displayValue

        return (
          <button
            key={i}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(starValue)}
            onMouseEnter={() => !readonly && setHoverValue(starValue)}
            title={`Gi ${starValue} stjerne${starValue > 1 ? 'r' : ''}`}
            aria-label={`Gi ${starValue} stjerne${starValue > 1 ? 'r' : ''}`}
            className={cn(
              'transition-colors',
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-transparent text-gray-300'
              )}
            />
          </button>
        )
      })}
      {value !== null && value !== undefined && (
        <span className="ml-1 text-sm text-muted-foreground">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  )
}
