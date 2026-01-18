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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
  MapPin,
  Briefcase,
  CheckCircle2,
  Clock,
  Hash,
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

interface JobApplication {
  id: string
  jobTitle?: string
  status: string
  createdAt: string
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
    availabilityStatus: string
    availabilityDate: string | null
    complianceStatus: string
    internalRating: number | null
    tags: string[]
    sectors: string[]
    certifications: Certification[]
    cvFilePath?: string | null
    pools?: Pool[]
    // Extended bluecrew_profile fields
    shortId?: string | null
    city?: string | null
    country?: string | null
    source?: string | null
    verifiedAt?: string | null
    candidateId?: string | null  // Link to relations
    applications?: JobApplication[]
  }
  isSelected?: boolean
  onSelectChange?: (checked: boolean) => void
}

// Availability status config
const availabilityConfig: Record<string, { label: string; color: string; dot: string }> = {
  available: { label: 'Tilgjengelig', color: 'text-green-600', dot: 'bg-green-500' },
  available_soon: { label: 'Snart', color: 'text-yellow-600', dot: 'bg-yellow-500' },
  on_assignment: { label: 'På oppdrag', color: 'text-blue-600', dot: 'bg-blue-500' },
  unavailable: { label: 'Utilgjengelig', color: 'text-gray-600', dot: 'bg-gray-500' },
  inactive: { label: 'Inaktiv', color: 'text-gray-400', dot: 'bg-gray-400' },
}

// Compliance/verification status config
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

// Source labels
const sourceLabels: Record<string, string> = {
  job_application: 'Jobbsøknad',
  campaign: 'Kampanje',
  bluecrew_portal: 'Bluecrew.no',
  manual: 'Manuell',
  import: 'Importert',
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

  // Location string
  const location = [candidate.city, candidate.country].filter(Boolean).join(', ')

  // Source label
  const sourceLabel = candidate.source ? (sourceLabels[candidate.source] || candidate.source) : null

  // Is confirmed (has cv_key)
  const isConfirmed = candidate.complianceStatus === 'approved' || candidate.complianceStatus === 'verified'

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
      // Use candidateId for pool membership (relationship link)
      const linkId = candidate.candidateId || candidate.id
      await addToPool.mutateAsync({ candidateId: linkId, poolId: favPool.id })
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
    <TooltipProvider>
      <div className="group relative flex items-center gap-4 p-4 bg-card border rounded-lg hover:shadow-md transition-shadow">
        {/* Checkbox */}
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelectChange?.(checked === true)}
          aria-label={`Velg ${candidate.firstName} ${candidate.lastName}`}
        />

        {/* Avatar with confirmation indicator */}
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage src={candidate.avatarUrl || undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {isConfirmed && (
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
              <CheckCircle2 className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Row 1: Name, ID, Rating, Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/candidates/${candidate.id}`}
              className="font-semibold hover:underline"
            >
              {candidate.firstName || ''} {candidate.lastName || ''}
            </Link>

            {/* Short ID */}
            {candidate.shortId && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground font-mono">
                    <Hash className="h-3 w-3 inline" />{candidate.shortId}
                  </span>
                </TooltipTrigger>
                <TooltipContent>Profil-ID</TooltipContent>
              </Tooltip>
            )}

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

          {/* Row 2: Role, Experience, Location */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <span>
              {candidate.primaryRole || 'Ikke spesifisert'}
              {candidate.secondaryRoles?.length > 0 && ` + ${candidate.secondaryRoles.length}`}
            </span>

            {candidate.experienceYears > 0 && (
              <>
                <span>•</span>
                <span>{candidate.experienceYears} år</span>
              </>
            )}

            {location && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {location}
                </span>
              </>
            )}

            {sourceLabel && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-xs">
                  <Briefcase className="h-3 w-3" />
                  {sourceLabel}
                </span>
              </>
            )}
          </div>

          {/* Row 3: Badges - Certs, Verified, Sectors, Tags, Pools, Applications */}
          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
            {/* Certifications */}
            {candidate.certifications.slice(0, 4).map((cert) => (
              <Tooltip key={cert.code}>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-xs cursor-help">
                    {cert.code}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>{cert.name}</TooltipContent>
              </Tooltip>
            ))}
            {candidate.certifications.length > 4 && (
              <Badge variant="secondary" className="text-xs">
                +{candidate.certifications.length - 4}
              </Badge>
            )}

            {/* Verified badge */}
            {isConfirmed && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                ✓ Bekreftet
              </Badge>
            )}

            {/* Has CV badge */}
            {candidate.cvFilePath && (
              <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                <FileText className="h-3 w-3 mr-1" />
                CV
              </Badge>
            )}

            {/* Sector badges */}
            {candidate.sectors?.slice(0, 2).map((sector) => (
              <Badge key={sector} variant="outline" className="text-xs text-blue-600 border-blue-200">
                {sector}
              </Badge>
            ))}
            {candidate.sectors && candidate.sectors.length > 2 && (
              <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                +{candidate.sectors.length - 2}
              </Badge>
            )}

            {/* Tag badges */}
            {candidate.tags?.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                {tag}
              </Badge>
            ))}
            {candidate.tags && candidate.tags.length > 2 && (
              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                +{candidate.tags.length - 2}
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

            {/* Job applications badge */}
            {candidate.applications && candidate.applications.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                    <Briefcase className="h-3 w-3 mr-1" />
                    {candidate.applications.length} søknad{candidate.applications.length > 1 ? 'er' : ''}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    {candidate.applications.slice(0, 3).map(app => (
                      <div key={app.id} className="text-xs">
                        {app.jobTitle || 'Ukjent stilling'} - {app.status}
                      </div>
                    ))}
                    {candidate.applications.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{candidate.applications.length - 3} flere
                      </div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Availability date if not currently available */}
            {candidate.availabilityDate && candidate.availabilityStatus !== 'available' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-200">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(candidate.availabilityDate).toLocaleDateString('nb-NO')}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Tilgjengelig fra</TooltipContent>
              </Tooltip>
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
    </TooltipProvider>
  )
}
