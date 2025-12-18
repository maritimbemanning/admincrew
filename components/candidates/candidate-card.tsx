'use client'

import Link from 'next/link'
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
} from 'lucide-react'
import type { AvailabilityStatus, ComplianceStatus } from '@/types'

interface Certification {
  code: string
  name: string
  expiryDate: string
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
    availabilityStatus: AvailabilityStatus
    availabilityDate: string | null
    complianceStatus: ComplianceStatus
    internalRating: number | null
    tags: string[]
    fylke: string | null
    certifications: Certification[]
  }
}

const availabilityConfig: Record<AvailabilityStatus, { label: string; color: string; dot: string }> = {
  available: { label: 'Tilgjengelig', color: 'text-green-600', dot: 'bg-green-500' },
  available_soon: { label: 'Snart', color: 'text-yellow-600', dot: 'bg-yellow-500' },
  on_assignment: { label: 'På oppdrag', color: 'text-blue-600', dot: 'bg-blue-500' },
  unavailable: { label: 'Utilgjengelig', color: 'text-gray-600', dot: 'bg-gray-500' },
  inactive: { label: 'Inaktiv', color: 'text-gray-400', dot: 'bg-gray-400' },
}

const complianceConfig: Record<ComplianceStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  not_started: { label: 'Ikke startet', variant: 'secondary' },
  documents_pending: { label: 'Dokumenter mangler', variant: 'outline' },
  review_pending: { label: 'Under vurdering', variant: 'outline' },
  approved: { label: 'Godkjent', variant: 'default' },
  expired: { label: 'Utløpt', variant: 'destructive' },
  rejected: { label: 'Avvist', variant: 'destructive' },
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  const availability = availabilityConfig[candidate.availabilityStatus]
  const compliance = complianceConfig[candidate.complianceStatus]
  const initials = `${candidate.firstName[0]}${candidate.lastName[0]}`

  return (
    <div className="group relative flex items-center gap-4 p-4 bg-card border rounded-lg hover:shadow-md transition-shadow">
      {/* Checkbox */}
      <Checkbox className="opacity-0 group-hover:opacity-100 transition-opacity" />

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
            {candidate.firstName} {candidate.lastName}
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
          {candidate.primaryRole} • {candidate.experienceYears} år • {candidate.fylke}
        </div>

        {/* Certifications */}
        <div className="flex items-center gap-1 mt-1.5">
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

          {candidate.complianceStatus === 'approved' && (
            <Badge variant="outline" className="text-xs text-green-600 border-green-200">
              ✓ Compliance
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
            <DropdownMenuItem>
              <FileText className="h-4 w-4 mr-2" />
              Se CV
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Phone className="h-4 w-4 mr-2" />
              Ring
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Mail className="h-4 w-4 mr-2" />
              Send e-post
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Star className="h-4 w-4 mr-2" />
              Legg til i favoritter
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
