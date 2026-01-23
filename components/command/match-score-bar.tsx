'use client'

import { cn } from '@/lib/utils'

interface MatchScoreBarProps {
  score: number // 0-100
  showLabel?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function MatchScoreBar({
  score,
  showLabel = true,
  size = 'md',
  className
}: MatchScoreBarProps) {
  const clampedScore = Math.min(100, Math.max(0, score))

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showLabel && (
        <span className="text-tactical text-gold-400 w-8 text-right">
          {Math.round(clampedScore)}%
        </span>
      )}
      <div className={cn(
        'match-score-bar flex-1',
        size === 'sm' && 'h-1'
      )}>
        <div
          className="match-score-fill"
          style={{ width: `${clampedScore}%` }}
        />
      </div>
    </div>
  )
}
