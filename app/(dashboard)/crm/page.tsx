'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PipelineKanban } from '@/components/crm/pipeline-kanban'
import { ContactList } from '@/components/crm/contact-list'
import { useDebounce } from '@/hooks/use-debounce'
import type { CrmContact, CrmContactFilters, CrmPriority } from '@/types/crm'
import { CRM_PRIORITY_LABELS, CRM_PRIORITY_LEVELS } from '@/types/crm'
import { INDUSTRIES } from '@/lib/validations/crm'

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

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">CRM</h1>
            <p className="text-sm text-muted-foreground">
              Administrer kunder og salgspipeline
            </p>
          </div>
          <Button onClick={() => handleNewContact()}>
            <Plus className="h-4 w-4 mr-2" />
            Ny kontakt
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk på navn, selskap, e-post..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select
            value={industryFilter || 'all'}
            onValueChange={(val) => setIndustryFilter(val === 'all' ? undefined : val)}
          >
            <SelectTrigger className="w-[160px]">
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

          <Select
            value={priorityFilter || 'all'}
            onValueChange={(val) =>
              setPriorityFilter(val === 'all' ? undefined : (val as CrmPriority))
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Prioritet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              {CRM_PRIORITY_LEVELS.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {CRM_PRIORITY_LABELS[priority]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Nullstill filtre
            </Button>
          )}

          <div className="flex-1" />

          {/* View toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={view === 'kanban' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-r-none"
              onClick={() => setView('kanban')}
              title="Kanban-visning"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-l-none"
              onClick={() => setView('list')}
              title="Listevisning"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
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
