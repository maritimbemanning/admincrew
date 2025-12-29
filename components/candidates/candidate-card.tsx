'use client'

import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Star,
  MoreHorizontal,
  Phone,
  Mail,
  FileText,
  Target,
  ChevronRight,
  Archive,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { getCvSignedUrl } from '@/hooks/use-inbox'
import { useArchiveCandidate, useAddCandidateToPool, usePools } from '@/hooks'
interface Certification {
  code: string
  name: string
  expiryDate: string
}

interface Pool {
  id: string
  name: string
  color: string
}

interface CandidateCardProps {
  candidate: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
    avatarUrl: string | null
    primaryRole: string
    secondaryRoles: string[]
    experienceYears: number
    availabilityStatus: string  // 'available', 'on_assignment', 'unavailable'
    availabilityDate: string | null
    complianceStatus: string  // 'pending_bankid', 'pending_documents', 'verified', 'rejected'
    internalRating: number | null
    tags: string[]
    fylke: string | null
    certifications: Certification[]
    cvFilePath?: string | null
    pools?: Pool[]
  }
  isSelected?: boolean
  onSelectChange?: (checked: boolean) => void
}

// Availability status config - matches actual DB values
const availabilityConfig: Record<string, { label: string; color: string; dot: string }> = {
  available: { label: 'Tilgjengelig', color: 'text-green-600', dot: 'bg-green-500' },
  available_soon: { label: 'Snart', color: 'text-yellow-600', dot: 'bg-yellow-500' },
  on_assignment: { label: 'På oppdrag', color: 'text-blue-600', dot: 'bg-blue-500' },
  unavailable: { label: 'Utilgjengelig', color: 'text-gray-600', dot: 'bg-gray-500' },
  inactive: { label: 'Inaktiv', color: 'text-gray-400', dot: 'bg-gray-400' },
}

// Compliance/verification status config - matches actual DB values
const complianceConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending_bankid: { label: 'Venter BankID', variant: 'outline' },
  pending_documents: { label: 'Dokumenter mangler', variant: 'outline' },
  pending_review: { label: 'Under vurdering', variant: 'outline' },
  pending: { label: 'Pending', variant: 'secondary' },
  verified: { label: 'Verifisert', variant: 'default' },
  approved: { label: 'Godkjent', variant: 'default' },
  rejected: { label: 'Avvist', variant: 'destructive' },
  expired: { label: 'Utløpt', variant: 'destructive' },
  not_started: { label: 'Ikke startet', variant: 'secondary' },
  documents_pending: { label: 'Dokumenter mangler', variant: 'outline' },
  review_pending: { label: 'Under vurdering', variant: 'outline' },
}

export function CandidateCard({ candidate, isSelected, onSelectChange }: CandidateCardProps) {
  const availability = availabilityConfig[candidate.availabilityStatus] || availabilityConfig.available
  const compliance = complianceConfig[candidate.complianceStatus] || complianceConfig.not_started
  const archiveCandidate = useArchiveCandidate()
  const addToPool = useAddCandidateToPool()
  const { data: pools } = usePools()
  const [isDownloadingCv, setIsDownloadingCv] = useState(false)
  
  // Handle potentially empty names
  const firstInitial = candidate.firstName?.[0] || ''
  const lastInitial = candidate.lastName?.[0] || ''
  const initials = (firstInitial + lastInitial).toUpperCase() || '??'

  const handleViewCv = async () => {
    if (!candidate.cvFilePath) {
      toast.error('Ingen CV tilgjengelig')
      return
    }
    setIsDownloadingCv(true)
    try {
      const url = await getCvSignedUrl(candidate.cvFilePath)
      if (url) {
        window.open(url, '_blank')
      } else {
        toast.error('Kunne ikke åpne CV')
      }
    } catch {
      toast.error('Feil ved åpning av CV')
    } finally {
      setIsDownloadingCv(false)
    }
  }

  const handleAddToFavorites = async () => {
    const favPool = pools?.find(p => p.slug === 'favoritter')
    if (!favPool) {
      toast.error('Favoritter-pool ikke funnet')
      return
    }
    try {
      await addToPool.mutateAsync({ candidateId: candidate.id, poolId: favPool.id })
      toast.success(`${candidate.firstName} lagt til i favoritter`)
    } catch {
      toast.error('Kunne ikke legge til i favoritter')
    }
  }

  const handleArchive = async () => {
    try {
      await archiveCandidate.mutateAsync(candidate.id)
      toast.success(`${candidate.firstName} arkivert`)
    } catch {
      toast.error('Kunne ikke arkivere kandidat')
    }
  }

  return (
    <div className="group relative flex items-center gap-4 p-4 bg-card border rounded-lg hover:shadow-md transition-shadow">
      {/* Checkbox */}
      <Checkbox 
        checked={isSelected}
        onCheckedChange={(checked) => onSelectChange?.(checked === true)}
        aria-label={`Velg ${candidate.firstName} ${candidate.lastName}`}
      />

      {/* Avatar */}
      <Avatar className="h-12 w-12">
        <AvatarImage src={candidate.avatarUrl || undefined} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            href={`/candidates/${candidate.id}`}
            className="font-semibold hover:underline"
          >
            {candidate.firstName || ''} {candidate.lastName || ''}
          </Link>

          {/* Rating */}
          {candidate.internalRating && (
            <div className="flex items-center gap-0.5 text-amber-500">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span className="text-xs font-medium">{candidate.internalRating}</span>
            </div>
          )}

          {/* Availability Status */}
          <div className={cn('flex items-center gap-1.5 text-xs', availability.color)}>
            <span className={cn('h-2 w-2 rounded-full', availability.dot)} />
            {availability.label}
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {candidate.primaryRole || 'Ikke spesifisert'}
          {candidate.experienceYears > 0 && ` • ${candidate.experienceYears} år`}
          {candidate.fylke && ` • ${candidate.fylke}`}
        </div>

        {/* Certifications & Pools */}
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          {candidate.certifications.slice(0, 4).map((cert) => (
            <Badge key={cert.code} variant="secondary" className="text-xs">
              {cert.code}
            </Badge>
          ))}
          {candidate.certifications.length > 4 && (
            <Badge variant="secondary" className="text-xs">
              +{candidate.certifications.length - 4}
            </Badge>
          )}

          {(candidate.complianceStatus === 'approved' || candidate.complianceStatus === 'verified') && (
            <Badge variant="outline" className="text-xs text-green-600 border-green-200">
              ✓ Verifisert
            </Badge>
          )}

          {/* Pool badges */}
          {candidate.pools && candidate.pools.slice(0, 2).map((pool) => (
            <Badge 
              key={pool.id} 
              variant="outline" 
              className="text-xs"
              style={{ borderColor: pool.color, color: pool.color }}
            >
              {pool.name}
            </Badge>
          ))}
          {candidate.pools && candidate.pools.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{candidate.pools.length - 2} pools
            </Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="outline" size="sm">
          <Target className="h-4 w-4 mr-1" />
          Match
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleViewCv} disabled={isDownloadingCv || !candidate.cvFilePath}>
              {isDownloadingCv ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              {candidate.cvFilePath ? 'Se CV' : 'Ingen CV'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => candidate.phone && window.open(`tel:${candidate.phone}`)}>
              <Phone className="h-4 w-4 mr-2" />
              Ring {candidate.phone || 'N/A'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(`mailto:${candidate.email}`)}>
              <Mail className="h-4 w-4 mr-2" />
              Send e-post
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleAddToFavorites}>
              <Star className="h-4 w-4 mr-2" />
              Legg til i favoritter
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleArchive} className="text-orange-600">
              <Archive className="h-4 w-4 mr-2" />
              Arkiver
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" asChild>
          <Link href={`/candidates/${candidate.id}`}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
