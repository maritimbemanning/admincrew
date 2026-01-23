'use client'

import { cn } from '@/lib/utils'
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label: string
  }
  className?: string
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
}: MetricCardProps) {
  const getTrendColor = () => {
    if (!trend) return ''
    if (trend.value > 0) return 'text-green-600'
    if (trend.value < 0) return 'text-red-600'
    return 'text-gray-500'
  }

  const renderTrendIcon = () => {
    if (!trend) return null
    if (trend.value > 0) return <TrendingUp className="h-3 w-3 mr-1" />
    if (trend.value < 0) return <TrendingDown className="h-3 w-3 mr-1" />
    return <Minus className="h-3 w-3 mr-1" />
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(subtitle || trend) && (
          <div className="flex items-center gap-2 mt-1">
            {trend && (
              <span className={cn('flex items-center text-xs', getTrendColor())}>
                {renderTrendIcon()}
                {trend.value > 0 ? '+' : ''}
                {trend.value}% {trend.label}
              </span>
            )}
            {subtitle && !trend && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
