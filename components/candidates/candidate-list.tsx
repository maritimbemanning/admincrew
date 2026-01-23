'use client'

import { useState } from 'react'
import { useCandidates, usePools, useAddCandidateToPool } from '@/hooks'
import { useBulkArchiveCandidates, useBulkDeleteCandidates } from '@/hooks/use-candidate'
import { CandidateCard } from './candidate-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Users, FolderPlus, Loader2, Archive, Trash2 } from 'lucide-react'
import type { CandidateFilters, CandidateSort } from '@/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface CandidateListProps {
  filters?: CandidateFilters
  sort?: CandidateSort
  poolId?: string
  page?: number
  pageSize?: number
  onPageChange?: (page: number) => void
}

export function CandidateList({
  filters,
  sort,
  poolId,
  page = 1,
  pageSize = 25,
  onPageChange,
}: CandidateListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isAddingToPool, setIsAddingToPool] = useState(false)
  
  const { data, isLoading, error } = useCandidates({
    filters,
    sort,
    poolId,
    page,
    pageSize,
  })

  const { data: pools } = usePools()
  const addToPool = useAddCandidateToPool()
  const bulkArchive = useBulkArchiveCandidates()
  const bulkDelete = useBulkDeleteCandidates()

  const handleArchiveSelected = async () => {
    if (selectedIds.size === 0) return
    
    try {
      await bulkArchive.mutateAsync(Array.from(selectedIds))
      toast.success(`${selectedIds.size} kandidat(er) arkivert`)
      setSelectedIds(new Set())
    } catch (error) {
      toast.error('Kunne ikke arkivere kandidater')
      console.error(error)
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    
    try {
      await bulkDelete.mutateAsync(Array.from(selectedIds))
      toast.success(`${selectedIds.size} kandidat(er) slettet permanent`)
      setSelectedIds(new Set())
    } catch (error) {
      toast.error('Kunne ikke slette kandidater')
      console.error(error)
    }
  }

  const handleAddToPool = async (poolId: string, poolName: string) => {
    if (selectedIds.size === 0) return
    
    setIsAddingToPool(true)
    try {
      const promises = Array.from(selectedIds).map(candidateId =>
        addToPool.mutateAsync({ candidateId, poolId })
      )
      await Promise.all(promises)
      toast.success(`${selectedIds.size} kandidat(er) lagt til i "${poolName}"`)
      setSelectedIds(new Set())
    } catch (error) {
      toast.error('Kunne ikke legge til i pool')
      console.error(error)
    } finally {
      setIsAddingToPool(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked && data) {
      setSelectedIds(new Set(data.candidates.map(c => c.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectCandidate = (candidateId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(candidateId)
    } else {
      newSelected.delete(candidateId)
    }
    setSelectedIds(newSelected)
  }

  if (isLoading) {
    return <CandidateListSkeleton />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold mb-2">Kunne ikke laste kandidater</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Det oppstod en feil ved lasting av kandidatlisten.
        </p>
        <p className="text-xs text-muted-foreground">
          {error instanceof Error ? error.message : 'Ukjent feil'}
        </p>
      </div>
    )
  }

  if (!data || data.candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="text-2xl">👥</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">Ingen kandidater funnet</h3>
        <p className="text-sm text-muted-foreground">
          {filters && Object.keys(filters).length > 0
            ? 'Prøv å justere filtrene dine for å se flere resultater.'
            : 'Det er ingen kandidater i databasen ennå.'}
        </p>
      </div>
    )
  }

  const allSelected = data.candidates.length > 0 && selectedIds.size === data.candidates.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < data.candidates.length

  return (
    <div className="space-y-3">
      {/* Header with bulk actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox 
            checked={allSelected}
            ref={(el) => {
              if (el) (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate = someSelected
            }}
            onCheckedChange={handleSelectAll}
            aria-label="Velg alle"
          />
          <span className="text-sm text-muted-foreground">
            {selectedIds.size > 0 
              ? `${selectedIds.size} valgt`
              : `Viser ${data.candidates.length} av ${data.total} kandidater`}
            {data.totalPages > 1 && selectedIds.size === 0 && ` (side ${data.page} av ${data.totalPages})`}
          </span>
        </div>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isAddingToPool}>
                  {isAddingToPool ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FolderPlus className="h-4 w-4 mr-2" />
                  )}
                  Legg til i pool
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {/* System pools (favoritter/blacklist) */}
                {pools?.filter(p => p.is_system && ['favoritter', 'blacklist'].includes(p.slug)).map(pool => (
                  <DropdownMenuItem 
                    key={pool.id}
                    onClick={() => handleAddToPool(pool.id, pool.name)}
                  >
                    {pool.name}
                  </DropdownMenuItem>
                ))}
                
                {/* Custom pools */}
                {pools?.filter(p => !p.is_system).length ? (
                  <>
                    <DropdownMenuSeparator />
                    {pools.filter(p => !p.is_system).map(pool => (
                      <DropdownMenuItem 
                        key={pool.id}
                        onClick={() => handleAddToPool(pool.id, pool.name)}
                      >
                        {pool.name}
                      </DropdownMenuItem>
                    ))}
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleArchiveSelected}
              disabled={bulkArchive.isPending}
            >
              {bulkArchive.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Archive className="h-4 w-4 mr-2" />
              )}
              Arkiver
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={bulkDelete.isPending}
                >
                  {bulkDelete.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Slett
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Dette vil permanent slette {selectedIds.size} kandidat(er). 
                    Denne handlingen kan ikke angres.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteSelected}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Ja, slett permanent
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              <Users className="h-4 w-4 mr-2" />
              Avmarker ({selectedIds.size})
            </Button>
          </div>
        )}
      </div>

      {/* Candidate cards */}
      {data.candidates.map((candidate) => {
        // Sertifikater fra certifications-relasjonen
        const certifications: Array<{ code: string; name: string; expiryDate: string }> =
          candidate.certifications?.map(cert => ({
            code: cert.code || '',
            name: cert.name || cert.code || '',
            expiryDate: cert.expiry_date || ''
          })) || []

        // Pools fra kandidatens data
        const candidatePools = candidate.pools?.map(p => ({
          id: p.id,
          name: p.name,
          color: p.color || '#888',
        })) || []

        // Extract _raw fields from bluecrew_profiles
        const raw = candidate._raw as Record<string, unknown> | undefined

        return (
          <CandidateCard
            key={candidate.id}
            candidate={{
              id: candidate.id,
              firstName: candidate.first_name,
              lastName: candidate.last_name,
              email: candidate.email,
              phone: candidate.phone,
              avatarUrl: candidate.avatar_url,
              primaryRole: candidate.primary_role,
              secondaryRoles: candidate.secondary_roles,
              experienceYears: candidate.experience_years,
              availabilityStatus: candidate.availability_status,
              availabilityDate: candidate.availability_date,
              complianceStatus: candidate.compliance_status,
              internalRating: candidate.internal_rating,
              tags: candidate.tags,
              sectors: candidate.sectors || [],
              certifications,
              cvFilePath: candidate.cv_key || raw?.cv_key as string || null,
              pools: candidatePools,
              // Extended bluecrew_profile fields
              shortId: raw?.short_id as string || null,
              city: raw?.city as string || null,
              country: raw?.country as string || null,
              source: raw?.source as string || null,
              verifiedAt: raw?.verified_at as string || null,
              candidateId: raw?.candidate_id as string || null,
            }}
            isSelected={selectedIds.has(candidate.id)}
            onSelectChange={(checked) => handleSelectCandidate(candidate.id, checked)}
          />
        )
      })}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Side {data.page} av {data.totalPages} ({data.total} totalt)
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange?.(1)}
              disabled={data.page <= 1}
              aria-label="Første side"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange?.(data.page - 1)}
              disabled={data.page <= 1}
              aria-label="Forrige side"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(data.page - 2, data.totalPages - 4)) + i
              if (pageNum > data.totalPages) return null
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === data.page ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => onPageChange?.(pageNum)}
                  aria-label={`Side ${pageNum}`}
                  aria-current={pageNum === data.page ? 'page' : undefined}
                >
                  {pageNum}
                </Button>
              )
            })}
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange?.(data.page + 1)}
              disabled={data.page >= data.totalPages}
              aria-label="Neste side"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange?.(data.totalPages)}
              disabled={data.page >= data.totalPages}
              aria-label="Siste side"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function CandidateListSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-5 w-48" />
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
