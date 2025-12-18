'use client'

import { useState } from 'react'
import { Search, Loader2, Zap, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { MatchResultCard, MatchResultRow } from './match-result-card'
import { useRunMatching, formatExecutionTime } from '@/hooks/use-matching'
import { matchingCriteriaSchema, type MatchingCriteriaData } from '@/lib/validations/operations'
import type { MatchResult, MatchingResult } from '@/types/operations'
import { cn } from '@/lib/utils'

// Common roles for maritime staffing
const COMMON_ROLES = [
  'Kaptein',
  'Overstyrmann',
  'Styrmann',
  'Maskinsjef',
  'Maskinist',
  'Matros',
  'Motormann',
  'Kokk',
  'DP-operatør',
]

// Common certifications
const COMMON_CERTS = [
  'D1', 'D2', 'D3', 'D4', 'D5', 'D6',
  'STCW',
  'DP-BAS', 'DP-ADV', 'DP-FULL',
  'Helse',
  'BOSIET',
  'HUET',
]

interface MatchingPanelProps {
  defaultRole?: string
  defaultStartDate?: string
  defaultCerts?: string[]
  onAddToShortlist?: (result: MatchResult) => void
  shortlistedIds?: string[]
}

export function MatchingPanel({
  defaultRole = '',
  defaultStartDate = '',
  defaultCerts = [],
  onAddToShortlist,
  shortlistedIds = [],
}: MatchingPanelProps) {
  const [results, setResults] = useState<MatchingResult | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')

  const runMatching = useRunMatching()

  const form = useForm<MatchingCriteriaData>({
    resolver: zodResolver(matchingCriteriaSchema) as any,
    defaultValues: {
      role: defaultRole,
      start_date: defaultStartDate || new Date().toISOString().split('T')[0],
      certifications: {
        required: defaultCerts,
        preferred: [],
      },
      experience: {},
      languages: { required: [], preferred: [] },
      location: { fylke: [] },
      availability: { status: ['available', 'available_soon'] },
      exclude_candidate_ids: [],
      include_pool_ids: [],
    },
  })

  const handleSubmit = async (data: MatchingCriteriaData) => {
    const result = await runMatching.mutateAsync({
      criteria: {
        role: data.role,
        start_date: data.start_date,
        certifications: data.certifications,
        experience: data.experience,
        languages: data.languages,
        location: data.location,
        availability: data.availability,
        exclude_candidate_ids: data.exclude_candidate_ids,
        include_pool_ids: data.include_pool_ids,
      },
      options: { limit: 50, includePartial: true },
    })
    setResults(result)
  }

  const selectedCerts = form.watch('certifications.required') || []

  const toggleCert = (cert: string) => {
    const current = form.getValues('certifications.required') || []
    if (current.includes(cert)) {
      form.setValue('certifications.required', current.filter((c) => c !== cert))
    } else {
      form.setValue('certifications.required', [...current, cert])
    }
  }

  // Group results by recommendation
  const groupedResults = results?.results.reduce(
    (acc, result) => {
      acc[result.recommendation].push(result)
      return acc
    },
    { strong: [], good: [], possible: [], weak: [] } as Record<string, MatchResult[]>
  )

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Zap className="h-5 w-5 text-yellow-500" />
          <span>Quick Match</span>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Basic Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rolle</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Velg rolle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COMMON_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Startdato</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex items-end">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={runMatching.isPending || !form.getValues('role')}
                >
                  {runMatching.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Matcher...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Match
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Cert Selection */}
            <div>
              <FormLabel className="text-sm">Påkrevde sertifikater</FormLabel>
              <div className="flex flex-wrap gap-2 mt-2">
                {COMMON_CERTS.map((cert) => (
                  <Badge
                    key={cert}
                    variant={selectedCerts.includes(cert) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/90"
                    onClick={() => toggleCert(cert)}
                  >
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Advanced Filters */}
            <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Filter className="h-4 w-4" />
                  Avanserte filtre
                  {showAdvanced ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="experience.min_years"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min. erfaring (år)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : undefined
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="experience.preferred_years"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Foretrukket erfaring (år)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="5"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : undefined
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </form>
        </Form>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">
                {results.results.length} kandidater funnet
              </h3>
              <span className="text-sm text-muted-foreground">
                ({formatExecutionTime(results.execution_time_ms)})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                Kort
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                Liste
              </Button>
            </div>
          </div>

          {/* Results by Category */}
          {groupedResults && (
            <div className="space-y-6">
              {/* Strong Matches */}
              {groupedResults.strong.length > 0 && (
                <ResultSection
                  title="Sterke matcher"
                  color="green"
                  results={groupedResults.strong}
                  viewMode={viewMode}
                  onAddToShortlist={onAddToShortlist}
                  shortlistedIds={shortlistedIds}
                />
              )}

              {/* Good Matches */}
              {groupedResults.good.length > 0 && (
                <ResultSection
                  title="Gode matcher"
                  color="blue"
                  results={groupedResults.good}
                  viewMode={viewMode}
                  onAddToShortlist={onAddToShortlist}
                  shortlistedIds={shortlistedIds}
                />
              )}

              {/* Possible Matches */}
              {groupedResults.possible.length > 0 && (
                <ResultSection
                  title="Mulige matcher"
                  color="yellow"
                  results={groupedResults.possible}
                  viewMode={viewMode}
                  onAddToShortlist={onAddToShortlist}
                  shortlistedIds={shortlistedIds}
                />
              )}

              {/* Weak Matches */}
              {groupedResults.weak.length > 0 && (
                <ResultSection
                  title="Svake matcher"
                  color="gray"
                  results={groupedResults.weak}
                  viewMode={viewMode}
                  onAddToShortlist={onAddToShortlist}
                  shortlistedIds={shortlistedIds}
                  defaultCollapsed
                />
              )}
            </div>
          )}

          {results.results.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Ingen kandidater matcher kriteriene.</p>
              <p className="text-sm mt-1">
                Prøv å justere filtrene eller fjerne noen krav.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ResultSectionProps {
  title: string
  color: 'green' | 'blue' | 'yellow' | 'gray'
  results: MatchResult[]
  viewMode: 'cards' | 'list'
  onAddToShortlist?: (result: MatchResult) => void
  shortlistedIds: string[]
  defaultCollapsed?: boolean
}

function ResultSection({
  title,
  color,
  results,
  viewMode,
  onAddToShortlist,
  shortlistedIds,
  defaultCollapsed = false,
}: ResultSectionProps) {
  const [isOpen, setIsOpen] = useState(!defaultCollapsed)

  const colorClasses = {
    green: 'border-green-500 bg-green-50',
    blue: 'border-blue-500 bg-blue-50',
    yellow: 'border-yellow-500 bg-yellow-50',
    gray: 'border-gray-400 bg-gray-50',
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div
          className={cn(
            'flex items-center justify-between px-3 py-2 rounded-lg border-l-4',
            colorClasses[color]
          )}
        >
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{title}</h4>
            <Badge variant="secondary">{results.length}</Badge>
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className={cn('mt-3', viewMode === 'cards' ? 'space-y-3' : 'space-y-2')}>
          {results.map((result) =>
            viewMode === 'cards' ? (
              <MatchResultCard
                key={result.candidate_id}
                result={result}
                onAddToShortlist={() => onAddToShortlist?.(result)}
                isInShortlist={shortlistedIds.includes(result.candidate_id)}
              />
            ) : (
              <MatchResultRow
                key={result.candidate_id}
                result={result}
                onAddToShortlist={() => onAddToShortlist?.(result)}
                isInShortlist={shortlistedIds.includes(result.candidate_id)}
              />
            )
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
