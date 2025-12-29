'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { usePools, useCreatePool, useDeletePool } from '@/hooks'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { PoolCreateDialog } from './pool-create-dialog'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu'
import { toast } from 'sonner'
import {
  Users,
  CheckCircle,
  Briefcase,
  Clock,
  Star,
  XCircle,
  Folder,
  FolderPlus,
  Anchor,
  Navigation,
  Compass,
  Settings,
  Zap,
  Monitor,
  Camera,
  Coffee,
  Utensils,
  ChefHat,
  User,
  Fish,
  Ship,
  Droplet,
  Award,
  Wrench,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit2,
} from 'lucide-react'
import type { PoolWithCount } from '@/hooks/use-pools'

interface PoolsSidebarProps {
  activePoolId?: string
  onPoolSelect?: (poolId: string) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

const iconMap: Record<string, React.ElementType> = {
  'users': Users,
  'check-circle': CheckCircle,
  'briefcase': Briefcase,
  'clock': Clock,
  'star': Star,
  'x-circle': XCircle,
  'folder': Folder,
  'anchor': Anchor,
  'navigation': Navigation,
  'compass': Compass,
  'settings': Settings,
  'zap': Zap,
  'monitor': Monitor,
  'camera': Camera,
  'coffee': Coffee,
  'utensils': Utensils,
  'chef-hat': ChefHat,
  'user': User,
  'fish': Fish,
  'ship': Ship,
  'droplet': Droplet,
  'award': Award,
  'tool': Wrench,
}

export function PoolsSidebar({ activePoolId, onPoolSelect, collapsed = false, onToggleCollapse }: PoolsSidebarProps) {
  const { data: pools, isLoading, error } = usePools()
  const createPool = useCreatePool()
  const deletePool = useDeletePool()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    system: true,
    favoritter: true,
    roller: false, // Collapsed by default to save space
    egne: true,
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  if (isLoading) {
    return <PoolsSidebarSkeleton />
  }

  if (error) {
    return (
      <div className="w-52 border-r bg-muted/30 flex flex-col shrink-0">
        <div className="p-3 border-b">
          <h2 className="font-semibold text-sm">Pools</h2>
        </div>
        <div className="p-3 text-sm text-destructive">
          Kunne ikke laste pools
        </div>
      </div>
    )
  }

  // Group pools by type
  const systemPools = pools?.filter(p => p.is_system && !['favoritter', 'blacklist'].includes(p.slug)) || []
  const favoritePools = pools?.filter(p => p.is_system && ['favoritter', 'blacklist'].includes(p.slug)) || []
  
  // Role-based pools (the ones we created)
  const roleSlugs = [
    'kaptein-skipsforer', 'overstyrmann', 'skipper-styrmann', 'matros', 'dekksoffiser',
    'maskinist-maskinsjef', 'motormann', 'eto', 'dp-operator', 'rov',
    'forpleiningssjef', 'forpleiningsassistent', 'kokk', 'steward',
    'fisker', 'servicebat', 'akvatekniker', 'annet'
  ]
  const rolePools = pools?.filter(p => !p.is_system && roleSlugs.includes(p.slug))
    .sort((a, b) => (b.member_count || 0) - (a.member_count || 0)) || []
  const customPools = pools?.filter(p => !p.is_system && !roleSlugs.includes(p.slug)) || []

  const handlePoolClick = (pool: PoolWithCount) => {
    onPoolSelect?.(pool.slug === 'alle' ? '' : pool.id)
  }

  const handleDeletePool = async (pool: PoolWithCount) => {
    try {
      await deletePool.mutateAsync(pool.id)
      toast.success(`Pool "${pool.name}" slettet`, {
        description: 'Kandidatene er ikke slettet, bare pool-koblingen.'
      })
    } catch (error) {
      toast.error('Kunne ikke slette pool')
    }
  }

  return (
    <div className="w-44 border-r bg-muted/30 flex flex-col shrink-0 overflow-y-auto">
      <div className="p-2 space-y-1.5">
          {/* System Pools */}
          {systemPools.length > 0 && (
            <div>
              <button 
                onClick={() => toggleSection('system')}
                className="w-full px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between hover:text-foreground"
              >
                <span>System</span>
                {expandedSections.system ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
              {expandedSections.system && (
                <div className="space-y-0.5">
                  {systemPools.map((pool) => (
                    <PoolItem
                      key={pool.id}
                      pool={pool}
                      isActive={activePoolId === pool.id || (activePoolId === undefined && pool.slug === 'alle')}
                      onClick={() => handlePoolClick(pool)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Favorite Pools */}
          {favoritePools.length > 0 && (
            <div>
              <button 
                onClick={() => toggleSection('favoritter')}
                className="w-full px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between hover:text-foreground"
              >
                <span>Merket</span>
                {expandedSections.favoritter ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
              {expandedSections.favoritter && (
                <div className="space-y-0.5">
                  {favoritePools.map((pool) => (
                    <PoolItem
                      key={pool.id}
                      pool={pool}
                      isActive={activePoolId === pool.id}
                      onClick={() => handlePoolClick(pool)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Role-based Pools */}
          {rolePools.length > 0 && (
            <div>
              <button 
                onClick={() => toggleSection('roller')}
                className="w-full px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between hover:text-foreground"
              >
                <span>Roller ({rolePools.reduce((sum, p) => sum + (p.member_count || 0), 0)})</span>
                {expandedSections.roller ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
              {expandedSections.roller && (
                <div className="space-y-0.5">
                  {rolePools.map((pool) => (
                    <PoolItem
                      key={pool.id}
                      pool={pool}
                      isActive={activePoolId === pool.id}
                      onClick={() => handlePoolClick(pool)}
                      onDelete={() => handleDeletePool(pool)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Custom Pools */}
          {customPools.length > 0 && (
            <div>
              <button 
                onClick={() => toggleSection('egne')}
                className="w-full px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between hover:text-foreground"
              >
                <span>Egne</span>
                {expandedSections.egne ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
              {expandedSections.egne && (
                <div className="space-y-0.5">
                  {customPools.map((pool) => (
                    <PoolItem
                      key={pool.id}
                      pool={pool}
                      isActive={activePoolId === pool.id}
                      onClick={() => handlePoolClick(pool)}
                      onDelete={() => handleDeletePool(pool)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ny pool knapp */}
          <PoolCreateDialog
          onSubmit={async (data) => {
            await createPool.mutateAsync({
              name: data.name,
              description: data.description,
              pool_type: data.type === 'dynamic' ? 'smart' : 'static',
            })
          }}
          trigger={
            <Button variant="ghost" className="w-full justify-start gap-2 mt-2" size="sm">
              <FolderPlus className="h-3 w-3" />
              <span className="text-xs">Ny pool</span>
            </Button>
          }
        />
        </div>
    </div>
  )
}

function PoolItem({
  pool,
  isActive,
  onClick,
  onDelete,
}: {
  pool: PoolWithCount
  isActive: boolean
  onClick: () => void
  onDelete?: () => void
}) {
  const canEdit = !pool.is_system

  const content = (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-muted'
      )}
    >
      <span 
        className="w-2 h-2 rounded-full shrink-0" 
        style={{ backgroundColor: pool.color }}
      />
      <span className="flex-1 text-left truncate">{pool.name}</span>
      <span className={cn(
        'text-[10px] tabular-nums',
        isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
      )}>
        {pool.member_count}
      </span>
    </button>
  )

  if (!canEdit) {
    return content
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {content}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onClick}>
          <Users className="h-3 w-3 mr-2" />
          Vis kandidater
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem 
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-3 w-3 mr-2" />
          Slett pool
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

function PoolsSidebarSkeleton() {
  return (
    <div className="w-44 border-r bg-muted/30 flex flex-col shrink-0 overflow-y-auto">
      <div className="p-2 space-y-1.5">
        <Skeleton className="h-4 w-12 mb-1" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>
    </div>
  )
}
