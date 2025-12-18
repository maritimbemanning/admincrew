'use client'

import { useCandidates } from '@/hooks'
import { CandidateCard } from './candidate-card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import type { CandidateFilters, CandidateSort } from '@/types'

interface CandidateListProps {
  filters?: CandidateFilters
  sort?: CandidateSort
  poolId?: string
  page?: number
  pageSize?: number
}

export function CandidateList({
  filters,
  sort,
  poolId,
  page = 1,
  pageSize = 25,
}: CandidateListProps) {
  const { data, isLoading, error } = useCandidates({
    filters,
    sort,
    poolId,
    page,
    pageSize,
  })

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
            ? 'Prov a justere filtrene dine for a se flere resultater.'
            : 'Det er ingen kandidater i databasen enna.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        Viser {data.candidates.length} av {data.total} kandidater
        {data.totalPages > 1 && ` (side ${data.page} av ${data.totalPages})`}
      </div>

      {data.candidates.map((candidate) => (
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
            fylke: candidate.fylke,
            certifications: (candidate.certifications || []).map((cert) => ({
              code: cert.code,
              name: cert.name,
              expiryDate: cert.expiry_date || '',
            })),
          }}
        />
      ))}
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
