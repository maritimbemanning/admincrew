'use client'

import { cn } from '@/lib/utils'
import { usePools } from '@/hooks'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  CheckCircle,
  Briefcase,
  Clock,
  Star,
  XCircle,
  Folder,
  FolderPlus,
} from 'lucide-react'
import type { PoolWithCount } from '@/hooks/use-pools'

interface PoolsSidebarProps {
  activePoolId?: string
  onPoolSelect?: (poolId: string) => void
}

const iconMap: Record<string, React.ElementType> = {
  'users': Users,
  'check-circle': CheckCircle,
  'briefcase': Briefcase,
  'clock': Clock,
  'star': Star,
  'x-circle': XCircle,
  'folder': Folder,
}

export function PoolsSidebar({ activePoolId, onPoolSelect }: PoolsSidebarProps) {
  const { data: pools, isLoading, error } = usePools()

  if (isLoading) {
    return <PoolsSidebarSkeleton />
  }

  if (error) {
    return (
      <div className="w-64 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm">Pools</h2>
        </div>
        <div className="p-4 text-sm text-destructive">
          Kunne ikke laste pools
        </div>
      </div>
    )
  }

  // Group pools by type
  const systemPools = pools?.filter(p => p.is_system && !['favoritter', 'blacklist'].includes(p.slug)) || []
  const favoritePools = pools?.filter(p => p.is_system && ['favoritter', 'blacklist'].includes(p.slug)) || []
  const customPools = pools?.filter(p => !p.is_system) || []

  const handlePoolClick = (pool: PoolWithCount) => {
    onPoolSelect?.(pool.slug === 'alle' ? '' : pool.id)
  }

  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-sm">Pools</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {/* System Pools */}
          {systemPools.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                System
              </div>
              <div className="space-y-1">
                {systemPools.map((pool) => (
                  <PoolItem
                    key={pool.id}
                    pool={pool}
                    isActive={activePoolId === pool.id || (activePoolId === undefined && pool.slug === 'alle')}
                    onClick={() => handlePoolClick(pool)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Favorite Pools */}
          {favoritePools.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Favoritter
              </div>
              <div className="space-y-1">
                {favoritePools.map((pool) => (
                  <PoolItem
                    key={pool.id}
                    pool={pool}
                    isActive={activePoolId === pool.id}
                    onClick={() => handlePoolClick(pool)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Custom Pools */}
          {customPools.length > 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Egne pools
              </div>
              <div className="space-y-1">
                {customPools.map((pool) => (
                  <PoolItem
                    key={pool.id}
                    pool={pool}
                    isActive={activePoolId === pool.id}
                    onClick={() => handlePoolClick(pool)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state for custom pools */}
          {customPools.length === 0 && (
            <div>
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Egne pools
              </div>
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                Ingen egne pools enna
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-2 border-t">
        <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
          <FolderPlus className="h-4 w-4" />
          Ny pool
        </Button>
      </div>
    </div>
  )
}

function PoolItem({
  pool,
  isActive,
  onClick,
}: {
  pool: PoolWithCount
  isActive: boolean
  onClick: () => void
}) {
  const Icon = iconMap[pool.icon] || Folder

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-muted'
      )}
    >
      <Icon className="h-4 w-4" style={{ color: isActive ? undefined : pool.color }} />
      <span className="flex-1 text-left truncate">{pool.name}</span>
      <span className={cn(
        'text-xs',
        isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
      )}>
        {pool.member_count}
      </span>
    </button>
  )
}

function PoolsSidebarSkeleton() {
  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-sm">Pools</h2>
      </div>
      <div className="p-2 space-y-4">
        <div>
          <Skeleton className="h-4 w-16 mb-2" />
          <div className="space-y-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <div className="space-y-1">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
