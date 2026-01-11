'use client'

import { useState } from 'react'
import { X, Filter, RotateCcw, Save } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

import {
  PRIMARY_ROLES,
  ROLE_DISPLAY_NAMES,
  SECTORS,
  SECTOR_DISPLAY_NAMES,
  AVAILABILITY_STATUSES,
  COMPLIANCE_STATUSES,
  LANGUAGES,
} from '@/lib/validations/candidate'

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

export interface CandidateFilterValues {
  roles: string[]
  primaryRoleOnly: boolean
  certifications: string[]
  availability: string[]
  compliance: string[]
  experienceMin: number
  experienceMax: number
  languages: string[]
  sectors: string[]
  ratingMin: number | null
  tags: string[]
}

const defaultFilters: CandidateFilterValues = {
  roles: [],
  primaryRoleOnly: false,
  certifications: [],
  availability: [],
  compliance: [],
  experienceMin: 0,
  experienceMax: 50,
  languages: [],
  sectors: [],
  ratingMin: null,
  tags: [],
}

// ═══════════════════════════════════════════════════════
// DISPLAY HELPERS
// ═══════════════════════════════════════════════════════

const AVAILABILITY_DISPLAY: Record<string, string> = {
  available: 'Tilgjengelig',
  available_soon: 'Snart tilgjengelig',
  on_assignment: 'På oppdrag',
  unavailable: 'Utilgjengelig',
  inactive: 'Inaktiv',
}

const COMPLIANCE_DISPLAY: Record<string, string> = {
  not_started: 'Ikke startet',
  documents_pending: 'Dokumenter mangler',
  review_pending: 'Venter på godkjenning',
  approved: 'Godkjent',
  expired: 'Utløpt',
  rejected: 'Avvist',
}

// Common maritime certifications
const COMMON_CERTIFICATIONS = [
  { code: 'D5', name: 'D5 - Dekksoffisersertifikat Kl. 5' },
  { code: 'D4', name: 'D4 - Dekksoffisersertifikat Kl. 4' },
  { code: 'D3', name: 'D3 - Dekksoffisersertifikat Kl. 3' },
  { code: 'D2', name: 'D2 - Dekksoffisersertifikat Kl. 2' },
  { code: 'D1', name: 'D1 - Dekksoffisersertifikat Kl. 1' },
  { code: 'M5', name: 'M5 - Maskinoffisersertifikat Kl. 5' },
  { code: 'M4', name: 'M4 - Maskinoffisersertifikat Kl. 4' },
  { code: 'M3', name: 'M3 - Maskinoffisersertifikat Kl. 3' },
  { code: 'M2', name: 'M2 - Maskinoffisersertifikat Kl. 2' },
  { code: 'M1', name: 'M1 - Maskinoffisersertifikat Kl. 1' },
  { code: 'STCW', name: 'STCW grunnleggende sikkerhet' },
  { code: 'DP-BAS', name: 'DP Basic' },
  { code: 'DP-ADV', name: 'DP Advanced' },
  { code: 'BOSIET', name: 'BOSIET' },
  { code: 'HUET', name: 'HUET' },
  { code: 'GMDSS-GOC', name: 'GMDSS GOC' },
  { code: 'HELSE', name: 'Helseerklæring' },
]

// ═══════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════

interface AdvancedFiltersProps {
  filters: CandidateFilterValues
  onFiltersChange: (filters: CandidateFilterValues) => void
  onSaveAsPool?: (filters: CandidateFilterValues) => void
}

// ═══════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════

export function AdvancedFilters({
  filters,
  onFiltersChange,
  onSaveAsPool,
}: AdvancedFiltersProps) {
  const [localFilters, setLocalFilters] = useState<CandidateFilterValues>(filters)
  const [open, setOpen] = useState(false)

  const activeFilterCount = countActiveFilters(filters)

  function countActiveFilters(f: CandidateFilterValues): number {
    let count = 0
    if (f.roles.length > 0) count++
    if (f.certifications.length > 0) count++
    if (f.availability.length > 0) count++
    if (f.compliance.length > 0) count++
    if (f.experienceMin > 0 || f.experienceMax < 50) count++
    if (f.languages.length > 0) count++
    if (f.sectors.length > 0) count++
    if (f.ratingMin !== null) count++
    if (f.tags.length > 0) count++
    return count
  }

  function handleRoleToggle(role: string) {
    const newRoles = localFilters.roles.includes(role)
      ? localFilters.roles.filter((r) => r !== role)
      : [...localFilters.roles, role]
    setLocalFilters({ ...localFilters, roles: newRoles })
  }

  function handleCertToggle(cert: string) {
    const newCerts = localFilters.certifications.includes(cert)
      ? localFilters.certifications.filter((c) => c !== cert)
      : [...localFilters.certifications, cert]
    setLocalFilters({ ...localFilters, certifications: newCerts })
  }

  function handleAvailabilityToggle(status: string) {
    const newAvail = localFilters.availability.includes(status)
      ? localFilters.availability.filter((s) => s !== status)
      : [...localFilters.availability, status]
    setLocalFilters({ ...localFilters, availability: newAvail })
  }

  function handleComplianceToggle(status: string) {
    const newCompl = localFilters.compliance.includes(status)
      ? localFilters.compliance.filter((s) => s !== status)
      : [...localFilters.compliance, status]
    setLocalFilters({ ...localFilters, compliance: newCompl })
  }

  function handleLanguageToggle(lang: string) {
    const newLangs = localFilters.languages.includes(lang)
      ? localFilters.languages.filter((l) => l !== lang)
      : [...localFilters.languages, lang]
    setLocalFilters({ ...localFilters, languages: newLangs })
  }

  function handleSectorToggle(sector: string) {
    const newSectors = localFilters.sectors.includes(sector)
      ? localFilters.sectors.filter((s) => s !== sector)
      : [...localFilters.sectors, sector]
    setLocalFilters({ ...localFilters, sectors: newSectors })
  }

  function handleApply() {
    onFiltersChange(localFilters)
    setOpen(false)
  }

  function handleReset() {
    setLocalFilters(defaultFilters)
  }

  function handleSaveAsPool() {
    if (onSaveAsPool) {
      onSaveAsPool(localFilters)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filtre
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>Avanserte filtre</SheetTitle>
          <SheetDescription>
            Filtrer kandidater basert på ulike kriterier
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-4">
            <Accordion type="multiple" defaultValue={['roles', 'availability']} className="w-full">
              {/* Roles */}
              <AccordionItem value="roles">
                <AccordionTrigger className="text-sm font-medium">
                  Rolle
                  {localFilters.roles.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {localFilters.roles.length}
                    </Badge>
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="primaryOnly"
                        checked={localFilters.primaryRoleOnly}
                        onCheckedChange={(checked) =>
                          setLocalFilters({ ...localFilters, primaryRoleOnly: !!checked })
                        }
                      />
                      <Label htmlFor="primaryOnly" className="text-sm">
                        Kun primærrolle
                      </Label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {PRIMARY_ROLES.map((role) => (
                        <div key={role} className="flex items-center space-x-2">
                          <Checkbox
                            id={`role-${role}`}
                            checked={localFilters.roles.includes(role)}
                            onCheckedChange={() => handleRoleToggle(role)}
                          />
                          <Label htmlFor={`role-${role}`} className="text-sm">
                            {ROLE_DISPLAY_NAMES[role] || role}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Certifications */}
              <AccordionItem value="certifications">
                <AccordionTrigger className="text-sm font-medium">
                  Sertifikater
                  {localFilters.certifications.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {localFilters.certifications.length}
                    </Badge>
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-2">
                    {COMMON_CERTIFICATIONS.map((cert) => (
                      <div key={cert.code} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cert-${cert.code}`}
                          checked={localFilters.certifications.includes(cert.code)}
                          onCheckedChange={() => handleCertToggle(cert.code)}
                        />
                        <Label htmlFor={`cert-${cert.code}`} className="text-sm">
                          {cert.code}
                        </Label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Availability */}
              <AccordionItem value="availability">
                <AccordionTrigger className="text-sm font-medium">
                  Tilgjengelighet
                  {localFilters.availability.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {localFilters.availability.length}
                    </Badge>
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {AVAILABILITY_STATUSES.map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`avail-${status}`}
                          checked={localFilters.availability.includes(status)}
                          onCheckedChange={() => handleAvailabilityToggle(status)}
                        />
                        <Label htmlFor={`avail-${status}`} className="text-sm">
                          {AVAILABILITY_DISPLAY[status]}
                        </Label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Compliance */}
              <AccordionItem value="compliance">
                <AccordionTrigger className="text-sm font-medium">
                  Compliance-status
                  {localFilters.compliance.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {localFilters.compliance.length}
                    </Badge>
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {COMPLIANCE_STATUSES.map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`compl-${status}`}
                          checked={localFilters.compliance.includes(status)}
                          onCheckedChange={() => handleComplianceToggle(status)}
                        />
                        <Label htmlFor={`compl-${status}`} className="text-sm">
                          {COMPLIANCE_DISPLAY[status]}
                        </Label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Experience */}
              <AccordionItem value="experience">
                <AccordionTrigger className="text-sm font-medium">
                  Erfaring
                  {(localFilters.experienceMin > 0 || localFilters.experienceMax < 50) && (
                    <Badge variant="secondary" className="ml-2">
                      {localFilters.experienceMin}-{localFilters.experienceMax} år
                    </Badge>
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Min: {localFilters.experienceMin} år</span>
                      <span>Maks: {localFilters.experienceMax} år</span>
                    </div>
                    <Slider
                      value={[localFilters.experienceMin, localFilters.experienceMax]}
                      onValueChange={([min, max]) =>
                        setLocalFilters({
                          ...localFilters,
                          experienceMin: min,
                          experienceMax: max,
                        })
                      }
                      min={0}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Languages */}
              <AccordionItem value="languages">
                <AccordionTrigger className="text-sm font-medium">
                  Språk
                  {localFilters.languages.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {localFilters.languages.length}
                    </Badge>
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-2 gap-2">
                    {LANGUAGES.map((lang) => (
                      <div key={lang.code} className="flex items-center space-x-2">
                        <Checkbox
                          id={`lang-${lang.code}`}
                          checked={localFilters.languages.includes(lang.code)}
                          onCheckedChange={() => handleLanguageToggle(lang.code)}
                        />
                        <Label htmlFor={`lang-${lang.code}`} className="text-sm">
                          {lang.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Sectors */}
              <AccordionItem value="sectors">
                <AccordionTrigger className="text-sm font-medium">
                  Sektor
                  {localFilters.sectors.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {localFilters.sectors.length}
                    </Badge>
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {SECTORS.map((sector) => (
                      <div key={sector} className="flex items-center space-x-2">
                        <Checkbox
                          id={`sector-${sector}`}
                          checked={localFilters.sectors.includes(sector)}
                          onCheckedChange={() => handleSectorToggle(sector)}
                        />
                        <Label htmlFor={`sector-${sector}`} className="text-sm">
                          {SECTOR_DISPLAY_NAMES[sector]}
                        </Label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Rating */}
              <AccordionItem value="rating">
                <AccordionTrigger className="text-sm font-medium">
                  Intern rating
                  {localFilters.ratingMin !== null && (
                    <Badge variant="secondary" className="ml-2">
                      Min {localFilters.ratingMin}
                    </Badge>
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  <Select
                    value={localFilters.ratingMin?.toString() || ''}
                    onValueChange={(val) =>
                      setLocalFilters({
                        ...localFilters,
                        ratingMin: val ? parseInt(val) : null,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Velg minimum rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Alle</SelectItem>
                      <SelectItem value="1">1+ stjerner</SelectItem>
                      <SelectItem value="2">2+ stjerner</SelectItem>
                      <SelectItem value="3">3+ stjerner</SelectItem>
                      <SelectItem value="4">4+ stjerner</SelectItem>
                      <SelectItem value="5">5 stjerner</SelectItem>
                    </SelectContent>
                  </Select>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t">
          <div className="flex w-full gap-2">
            <Button variant="outline" onClick={handleReset} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Nullstill
            </Button>
            {onSaveAsPool && (
              <Button variant="outline" onClick={handleSaveAsPool} className="gap-2">
                <Save className="h-4 w-4" />
                Lagre som pool
              </Button>
            )}
            <Button onClick={handleApply} className="flex-1">
              Bruk filtre
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════
// ACTIVE FILTERS DISPLAY COMPONENT
// ═══════════════════════════════════════════════════════

interface ActiveFiltersProps {
  filters: CandidateFilterValues
  onRemoveFilter: (filterType: keyof CandidateFilterValues, value?: string) => void
  onClearAll: () => void
}

export function ActiveFiltersDisplay({
  filters,
  onRemoveFilter,
  onClearAll,
}: ActiveFiltersProps) {
  const hasActiveFilters =
    filters.roles.length > 0 ||
    filters.certifications.length > 0 ||
    filters.availability.length > 0 ||
    filters.compliance.length > 0 ||
    filters.experienceMin > 0 ||
    filters.experienceMax < 50 ||
    filters.languages.length > 0 ||
    filters.sectors.length > 0 ||
    filters.ratingMin !== null ||
    filters.tags.length > 0

  if (!hasActiveFilters) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-muted-foreground">Aktive filtre:</span>

      {filters.roles.map((role) => (
        <Badge key={`role-${role}`} variant="secondary" className="gap-1">
          {ROLE_DISPLAY_NAMES[role] || role}
          <button
            onClick={() => onRemoveFilter('roles', role)}
            className="ml-1 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {filters.certifications.map((cert) => (
        <Badge key={`cert-${cert}`} variant="secondary" className="gap-1">
          {cert}
          <button
            onClick={() => onRemoveFilter('certifications', cert)}
            className="ml-1 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {filters.availability.map((status) => (
        <Badge key={`avail-${status}`} variant="secondary" className="gap-1">
          {AVAILABILITY_DISPLAY[status]}
          <button
            onClick={() => onRemoveFilter('availability', status)}
            className="ml-1 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}

      {(filters.experienceMin > 0 || filters.experienceMax < 50) && (
        <Badge variant="secondary" className="gap-1">
          {filters.experienceMin}-{filters.experienceMax} års erfaring
          <button
            onClick={() => onRemoveFilter('experienceMin')}
            className="ml-1 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      {filters.ratingMin !== null && (
        <Badge variant="secondary" className="gap-1">
          Min {filters.ratingMin} stjerner
          <button
            onClick={() => onRemoveFilter('ratingMin')}
            className="ml-1 hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}

      <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onClearAll}>
        Nullstill alle
      </Button>
    </div>
  )
}

export { defaultFilters }
