'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, X, Filter } from 'lucide-react'
import type { CampaignFilters } from '@/types/campaign'
import {
  POSITION_OPTIONS,
  SEGMENT_OPTIONS,
  STATUS_OPTIONS,
} from '@/lib/utils/campaign-constants'
import { cn } from '@/lib/utils'

interface CampaignFiltersProps {
  filters: CampaignFilters
  onFiltersChange: (filters: CampaignFilters) => void
  className?: string
}

export function CampaignFiltersPanel({
  filters,
  onFiltersChange,
  className,
}: CampaignFiltersProps) {
  const [isOpen, setIsOpen] = useState(true)

  const handlePositionToggle = (position: string) => {
    const current = filters.positions || []
    const updated = current.includes(position as any)
      ? current.filter((p) => p !== position)
      : [...current, position as any]
    onFiltersChange({ ...filters, positions: updated })
  }

  const handleSegmentToggle = (segment: string) => {
    const current = filters.segments || []
    const updated = current.includes(segment as any)
      ? current.filter((s) => s !== segment)
      : [...current, segment as any]
    onFiltersChange({ ...filters, segments: updated })
  }

  const handleStatusToggle = (status: string) => {
    const current = filters.statuses || []
    const updated = current.includes(status as any)
      ? current.filter((s) => s !== status)
      : [...current, status as any]
    onFiltersChange({ ...filters, statuses: updated })
  }

  const handleVerifiedChange = (value: string) => {
    onFiltersChange({
      ...filters,
      verified: value === 'all' ? 'all' : value === 'true',
    })
  }

  const handleClearFilters = () => {
    onFiltersChange({})
  }

  const activeFilterCount =
    (filters.positions?.length || 0) +
    (filters.segments?.length || 0) +
    (filters.statuses?.length || 0) +
    (filters.verified !== 'all' && filters.verified !== undefined ? 1 : 0)

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="flex items-center justify-between w-full group">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Filtre</CardTitle>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClearFilters()
                  }}
                  className="h-6 px-2 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Nullstill
                </Button>
              )}
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform text-muted-foreground',
                  isOpen && 'rotate-180'
                )}
              />
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Position Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Stilling</Label>
              <div className="space-y-2">
                {POSITION_OPTIONS.map((position) => {
                  const Icon = position.icon
                  return (
                    <div key={position.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`position-${position.value}`}
                        checked={filters.positions?.includes(position.value) || false}
                        onCheckedChange={() => handlePositionToggle(position.value)}
                      />
                      <Label
                        htmlFor={`position-${position.value}`}
                        className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {position.label}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Segment Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Segment</Label>
              <div className="space-y-2">
                {SEGMENT_OPTIONS.map((segment) => {
                  const Icon = segment.icon
                  return (
                    <div key={segment.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`segment-${segment.value}`}
                        checked={filters.segments?.includes(segment.value) || false}
                        onCheckedChange={() => handleSegmentToggle(segment.value)}
                      />
                      <Label
                        htmlFor={`segment-${segment.value}`}
                        className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {segment.labelNo}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Status</Label>
              <div className="space-y-2">
                {STATUS_OPTIONS.map((status) => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status.value}`}
                      checked={filters.statuses?.includes(status.value) || false}
                      onCheckedChange={() => handleStatusToggle(status.value)}
                    />
                    <Label
                      htmlFor={`status-${status.value}`}
                      className="flex items-center gap-2 text-sm font-normal cursor-pointer"
                    >
                      <Badge
                        variant="secondary"
                        className={cn('text-xs', status.bgColor, status.textColor)}
                      >
                        {status.label}
                      </Badge>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Verifisering</Label>
              <RadioGroup
                value={
                  filters.verified === true
                    ? 'true'
                    : filters.verified === false
                    ? 'false'
                    : 'all'
                }
                onValueChange={handleVerifiedChange}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="verified-all" />
                  <Label htmlFor="verified-all" className="text-sm font-normal cursor-pointer">
                    Alle
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="verified-true" />
                  <Label
                    htmlFor="verified-true"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Kun verifiserte (har kandidatprofil)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="verified-false" />
                  <Label
                    htmlFor="verified-false"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Kun uverifiserte
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
