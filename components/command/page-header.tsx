'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { SystemStatus } from './system-status'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Coordinate {
  label: string
  href?: string
}

interface Stat {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
}

interface PageHeaderProps {
  coordinates: Coordinate[]
  title: string
  subtitle?: string
  icon?: React.ReactNode
  systemStatus?: 'live' | 'synced' | 'offline'
  lastSync?: Date
  stats?: Stat[]
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  coordinates,
  title,
  subtitle,
  icon,
  systemStatus = 'live',
  lastSync,
  stats,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('glass-panel rounded-xl p-4 mb-6', className)}>
      {/* Top Row: Coordinates + System Status */}
      <div className="flex items-center justify-between mb-3">
        <nav className="text-coordinates">
          {coordinates.map((coord, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-1.5">/</span>}
              {coord.href ? (
                <Link href={coord.href} className="hover:text-gold-400 transition-colors">
                  {coord.label}
                </Link>
              ) : (
                <span>{coord.label}</span>
              )}
            </span>
          ))}
        </nav>
        <SystemStatus status={systemStatus} lastSync={lastSync || new Date()} />
      </div>

      {/* Main Row: Icon + Title + Actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="p-2.5 rounded-xl bg-gold-500/10">
              <span className="text-gold-500">{icon}</span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-2">{actions}</div>
        )}
      </div>

      {/* Stats Ticker */}
      {stats && stats.length > 0 && (
        <div className="flex items-center gap-6 mt-4 pt-3 border-t border-white/5">
          {stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-tactical text-muted-foreground">{stat.label}</span>
              <span className="text-lg font-semibold text-gold-400 font-mono">
                {stat.value}
              </span>
              {stat.trend && (
                <span className={cn(
                  'w-4 h-4',
                  stat.trend === 'up' && 'text-emerald-500',
                  stat.trend === 'down' && 'text-red-500',
                  stat.trend === 'neutral' && 'text-muted-foreground'
                )}>
                  {stat.trend === 'up' && <TrendingUp className="w-4 h-4" />}
                  {stat.trend === 'down' && <TrendingDown className="w-4 h-4" />}
                  {stat.trend === 'neutral' && <Minus className="w-4 h-4" />}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
