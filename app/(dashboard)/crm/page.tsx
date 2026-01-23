'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  List, 
  Building2, 
  Users, 
  TrendingUp, 
  DollarSign,
  Target,
  ArrowRight,
  X,
  Filter,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PipelineKanban } from '@/components/crm/pipeline-kanban'
import { ContactList } from '@/components/crm/contact-list'
import { useDebounce } from '@/hooks/use-debounce'
import type { CrmContact, CrmContactFilters, CrmPriority } from '@/types/crm'
import { CRM_PRIORITY_LABELS, CRM_PRIORITY_LEVELS } from '@/types/crm'
import { INDUSTRIES } from '@/lib/validations/crm'
import { cn } from '@/lib/utils'

export default function CrmPage() {
  const router = useRouter()
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [searchQuery, setSearchQuery] = useState('')
  const [industryFilter, setIndustryFilter] = useState<string | undefined>()
  const [priorityFilter, setPriorityFilter] = useState<CrmPriority | undefined>()

  const debouncedSearch = useDebounce(searchQuery, 300)

  const filters: CrmContactFilters = {
    search: debouncedSearch || undefined,
    industry: industryFilter ? [industryFilter] : undefined,
    priority: priorityFilter ? [priorityFilter] : undefined,
  }

  const handleContactClick = (contact: CrmContact) => {
    router.push(`/crm/contacts/${contact.id}`)
  }

  const handleNewContact = (status?: string) => {
    const params = status ? `?status=${status}` : ''
    router.push(`/crm/contacts/new${params}`)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setIndustryFilter(undefined)
    setPriorityFilter(undefined)
  }

  const hasActiveFilters = !!debouncedSearch || !!industryFilter || !!priorityFilter
  const activeFilterCount = [debouncedSearch, industryFilter, priorityFilter].filter(Boolean).length

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] space-y-6">
      {/* Premium Header */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gold-500/10">
                <Building2 className="h-6 w-6 text-gold-600 dark:text-gold-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">CRM Pipeline</h1>
                <p className="text-muted-foreground">
                  Administrer kunder og salgspipeline
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild className="hidden md:flex">
              <Link href="/crm/organizations">
                <Building2 className="h-4 w-4 mr-2" />
                Organisasjoner
              </Link>
            </Button>
            <Button 
              onClick={() => handleNewContact()}
              className="bg-navy-900 text-cream-50 hover:bg-navy-800 dark:bg-gold-500 dark:text-navy-900 dark:hover:bg-gold-400"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ny kontakt
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard title="Leads" value="24" icon={Users} color="blue" />
          <StatsCard title="Kvalifisert" value="12" icon={Target} color="gold" />
          <StatsCard title="Tilbud Sendt" value="8" icon={TrendingUp} color="green" />
          <StatsCard title="Pipeline Verdi" value="~4.2M" icon={DollarSign} color="gold" />
        </div>

        {/* Filters Card */}
        <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk på navn, selskap, e-post..."
                  className="pl-10 h-11 bg-background/50 border-border/50 focus:border-gold-500/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Industry Filter */}
                <Select
                  value={industryFilter || 'all'}
                  onValueChange={(val) => setIndustryFilter(val === 'all' ? undefined : val)}
                >
                  <SelectTrigger className="w-[160px] h-11 bg-background/50 border-border/50">
                    <SelectValue placeholder="Bransje" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle bransjer</SelectItem>
                    {INDUSTRIES.map((industry) => (
                      <SelectItem key={industry.value} value={industry.value}>
                        {industry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Priority Filter */}
                <Select
                  value={priorityFilter || 'all'}
                  onValueChange={(val) =>
                    setPriorityFilter(val === 'all' ? undefined : (val as CrmPriority))
                  }
                >
                  <SelectTrigger className="w-[140px] h-11 bg-background/50 border-border/50">
                    <SelectValue placeholder="Prioritet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    {CRM_PRIORITY_LEVELS.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        <span className="flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            priority === 'high' && "bg-red-500",
                            priority === 'normal' && "bg-orange-500",
                            priority === 'low' && "bg-blue-500",
                          )} />
                          {CRM_PRIORITY_LABELS[priority]}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="text-muted-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Nullstill ({activeFilterCount})
                  </Button>
                )}

                {/* View Toggle */}
                <div className="flex items-center border rounded-lg overflow-hidden bg-background/50 ml-auto">
                  <Button
                    variant={view === 'kanban' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="rounded-none h-11 w-11"
                    onClick={() => setView('kanban')}
                    title="Kanban-visning"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={view === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="rounded-none h-11 w-11"
                    onClick={() => setView('list')}
                    title="Listevisning"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Aktive filtre:</span>
                {debouncedSearch && (
                  <Badge variant="secondary" className="gap-1">
                    Søk: {debouncedSearch}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSearchQuery('')}
                    />
                  </Badge>
                )}
                {industryFilter && (
                  <Badge variant="secondary" className="gap-1">
                    {INDUSTRIES.find(i => i.value === industryFilter)?.label}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setIndustryFilter(undefined)}
                    />
                  </Badge>
                )}
                {priorityFilter && (
                  <Badge variant="secondary" className="gap-1">
                    {CRM_PRIORITY_LABELS[priorityFilter]}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setPriorityFilter(undefined)}
                    />
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto rounded-xl">
        {view === 'kanban' ? (
          <PipelineKanban
            filters={filters}
            onContactClick={handleContactClick}
            onNewContact={handleNewContact}
          />
        ) : (
          <ContactList
            filters={filters}
            onContactClick={handleContactClick}
          />
        )}
      </div>
    </div>
  )
}

// Stats Card Component
function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string
  value: string | number
  icon: React.ElementType
  color: 'gold' | 'blue' | 'green' | 'red'
}) {
  const colorStyles = {
    gold: 'text-gold-600 dark:text-gold-400 bg-gold-500/10',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-500/10',
    green: 'text-green-600 dark:text-green-400 bg-green-500/10',
    red: 'text-red-600 dark:text-red-400 bg-red-500/10',
  }

  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={cn("p-3 rounded-xl", colorStyles[color])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
