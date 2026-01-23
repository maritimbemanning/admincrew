'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Briefcase,
  Users,
  Clock,
  TrendingUp,
  Zap,
  ArrowRight,
  Target,
  Anchor,
  Ship,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RequestKanban } from '@/components/operations/request-kanban'
import { useRequests } from '@/hooks/use-requests'
import { useAssignments } from '@/hooks/use-assignments'
import type { RequestFilters } from '@/types/operations'
import { cn } from '@/lib/utils'

export default function OperationsPage() {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [filters, setFilters] = useState<Omit<RequestFilters, 'status'>>({})

  // Get stats
  const { data: requestsData } = useRequests({ pageSize: 1 })
  const { data: assignmentsData } = useAssignments({
    filters: { status: ['active'] },
    pageSize: 1,
  })

  const openRequestCount = requestsData?.total || 0
  const activeAssignmentCount = assignmentsData?.total || 0

  return (
    <div className="space-y-6">
      {/* Premium Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 p-8 text-white">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gold-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-blue-500 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gold-400 text-sm font-medium">
              <Activity className="h-4 w-4" />
              <span>Operations Center</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              Requests & Oppdrag
            </h1>
            <p className="text-cream-100/70 max-w-lg">
              Håndter innkommende requests, match kandidater og følg opp aktive oppdrag i sanntid.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="/operations/matching">
                <Zap className="mr-2 h-4 w-4" />
                Quick Match
              </Link>
            </Button>
            <Button 
              className="bg-gold-500 text-navy-900 hover:bg-gold-400 font-semibold shadow-lg shadow-gold-500/25"
              asChild
            >
              <Link href="/operations/requests/new">
                <Plus className="mr-2 h-4 w-4" /> Ny Request
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Stats in Hero */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-white/10">
          <QuickStat 
            label="Åpne Requests" 
            value={openRequestCount} 
            icon={Briefcase}
            href="/operations/requests"
          />
          <QuickStat 
            label="Aktive Oppdrag" 
            value={activeAssignmentCount} 
            icon={Anchor}
            href="/operations/assignments"
          />
          <QuickStat 
            label="Avg. Fill Time" 
            value="3.2d" 
            icon={Clock}
            subtext="Siste 30 dager"
          />
          <QuickStat 
            label="Pipeline Verdi" 
            value="~2.4M" 
            icon={TrendingUp}
            subtext="Estimert NOK"
          />
        </div>
      </div>

      {/* Filters Card */}
      <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Søk requests..."
                className="pl-10 h-11 bg-background/50 border-border/50 focus:border-gold-500/50"
                value={filters.search || ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
              />
            </div>

            <Select
              value={filters.priority?.join(',') || 'all'}
              onValueChange={(v) =>
                setFilters((prev) => ({
                  ...prev,
                  priority: v === 'all' ? undefined : [v as any],
                }))
              }
            >
              <SelectTrigger className="w-[160px] h-11 bg-background/50 border-border/50">
                <SelectValue placeholder="Prioritet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle prioriteter</SelectItem>
                <SelectItem value="urgent">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Haster
                  </span>
                </SelectItem>
                <SelectItem value="high">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    Høy
                  </span>
                </SelectItem>
                <SelectItem value="medium">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Normal
                  </span>
                </SelectItem>
                <SelectItem value="low">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gray-500" />
                    Lav
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center border rounded-lg overflow-hidden bg-background/50 ml-auto">
              <Button
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-none h-11 w-11"
                onClick={() => setViewMode('kanban')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-none h-11 w-11"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      <div className="min-h-[500px]">
        {viewMode === 'kanban' ? (
          <RequestKanban filters={filters} />
        ) : (
          <Card className="border-0 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 rounded-full bg-muted mb-4">
                <List className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-4">Liste-visning kommer snart</p>
              <Button variant="outline" onClick={() => setViewMode('kanban')}>
                Bruk Kanban-visning
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Navigation */}
      <div className="grid gap-4 md:grid-cols-3">
        <QuickNavCard 
          title="Alle Requests"
          description="Se og administrer alle requests"
          href="/operations/requests"
          icon={Briefcase}
        />
        <QuickNavCard 
          title="Aktive Oppdrag"
          description="Følg opp pågående leveranser"
          href="/operations/assignments"
          icon={Anchor}
        />
        <QuickNavCard 
          title="Quick Match"
          description="Finn kandidater raskt"
          href="/operations/matching"
          icon={Target}
        />
      </div>
    </div>
  )
}

// Quick Stat Component
function QuickStat({ 
  label, 
  value, 
  icon: Icon, 
  href,
  subtext 
}: { 
  label: string
  value: string | number
  icon: React.ElementType
  href?: string
  subtext?: string
}) {
  const content = (
    <div className="flex items-center gap-3">
      <div className="p-2.5 rounded-xl bg-white/10">
        <Icon className="h-5 w-5 text-gold-400" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-cream-100/60">{label}</p>
        {subtext && <p className="text-xs text-cream-100/40">{subtext}</p>}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="hover:bg-white/5 rounded-xl p-2 -m-2 transition-colors">
        {content}
      </Link>
    )
  }

  return content
}

// Quick Nav Card Component
function QuickNavCard({ 
  title, 
  description, 
  href, 
  icon: Icon 
}: { 
  title: string
  description: string
  href: string
  icon: React.ElementType
}) {
  return (
    <Link href={href}>
      <Card className="border-0 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 group cursor-pointer">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gold-500/10 text-gold-600 dark:text-gold-400 group-hover:bg-gold-500/20 transition-colors">
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </CardContent>
      </Card>
    </Link>
  )
}
