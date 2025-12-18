'use client'

import { Check, X, AlertTriangle, Star, MapPin, Clock } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { MatchResult } from '@/types/operations'
import { getRecommendationColor, getRecommendationLabel } from '@/hooks/use-matching'
import { cn } from '@/lib/utils'

interface MatchResultCardProps {
  result: MatchResult
  onAddToShortlist?: () => void
  onViewProfile?: () => void
  isInShortlist?: boolean
  showDetails?: boolean
}

export function MatchResultCard({
  result,
  onAddToShortlist,
  onViewProfile,
  isInShortlist = false,
  showDetails = true,
}: MatchResultCardProps) {
  const { candidate, total_score, scores, blockers, recommendation, is_full_match } = result

  const initials = candidate.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card className={cn('p-4', !is_full_match && 'opacity-75')}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Avatar className="h-12 w-12">
          <AvatarImage src={undefined} alt={candidate.full_name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold">{candidate.full_name}</h4>
              <p className="text-sm text-muted-foreground">
                {candidate.roles[0]} • {candidate.experience_years} år
              </p>
            </div>

            {/* Score Badge */}
            <div className="text-right">
              <div
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold',
                  getRecommendationColor(recommendation)
                )}
              >
                <span>{total_score}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {getRecommendationLabel(recommendation)}
              </p>
            </div>
          </div>

          {/* Quick Info */}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
            {/* Rating */}
            {candidate.internal_rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span>{candidate.internal_rating}</span>
              </div>
            )}

            {/* Location */}
            {candidate.fylke && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{candidate.fylke}</span>
              </div>
            )}

            {/* Availability */}
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {candidate.availability_status === 'available'
                  ? 'Tilgjengelig nå'
                  : candidate.availability_status === 'available_soon'
                  ? `Tilgj. ${candidate.availability_date ? new Date(candidate.availability_date).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' }) : 'snart'}`
                  : 'På oppdrag'}
              </span>
            </div>
          </div>

          {/* Certifications */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {candidate.active_certifications.slice(0, 5).map((cert) => (
              <Badge
                key={cert}
                variant="outline"
                className={cn(
                  'text-xs',
                  scores.certifications.matched.includes(cert.toLowerCase())
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-gray-50'
                )}
              >
                {cert}
              </Badge>
            ))}
            {candidate.active_certifications.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{candidate.active_certifications.length - 5}
              </Badge>
            )}
          </div>

          {/* Score Breakdown (if showDetails) */}
          {showDetails && (
            <div className="mt-3 pt-3 border-t space-y-2">
              <ScoreBar label="Sertifikater" score={scores.certifications.score} />
              <ScoreBar label="Erfaring" score={scores.experience.score} />
              <ScoreBar label="Tilgjengelighet" score={scores.availability.score} />
              <ScoreBar label="Rating" score={scores.rating.score} />
              <ScoreBar label="Lokasjon" score={scores.proximity.score} />
            </div>
          )}

          {/* Blockers */}
          {blockers.length > 0 && (
            <div className="mt-3 space-y-1">
              {blockers.map((blocker, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-2 text-xs px-2 py-1 rounded',
                    blocker.severity === 'blocker'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-yellow-50 text-yellow-700'
                  )}
                >
                  {blocker.severity === 'blocker' ? (
                    <X className="h-3.5 w-3.5" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  )}
                  <span>{blocker.description}</span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              variant={isInShortlist ? 'secondary' : 'default'}
              size="sm"
              onClick={onAddToShortlist}
              disabled={isInShortlist}
            >
              {isInShortlist ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  I shortlist
                </>
              ) : (
                'Legg til shortlist'
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={onViewProfile}>
              Se profil
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-24">{label}</span>
      <Progress value={score} className="h-1.5 flex-1" />
      <span className="text-xs font-medium w-8 text-right">{score}</span>
    </div>
  )
}

// Compact version for list view
interface MatchResultRowProps {
  result: MatchResult
  onAddToShortlist?: () => void
  isInShortlist?: boolean
}

export function MatchResultRow({
  result,
  onAddToShortlist,
  isInShortlist = false,
}: MatchResultRowProps) {
  const { candidate, total_score, recommendation, is_full_match, blockers } = result

  const initials = candidate.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors',
        !is_full_match && 'opacity-75'
      )}
    >
      {/* Avatar */}
      <Avatar className="h-10 w-10">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate">{candidate.full_name}</h4>
          {candidate.internal_rating && (
            <div className="flex items-center gap-0.5 text-xs">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {candidate.internal_rating}
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {candidate.roles[0]} • {candidate.experience_years} år • {candidate.fylke || 'Ukjent'}
        </p>
      </div>

      {/* Certs */}
      <div className="hidden md:flex gap-1">
        {candidate.active_certifications.slice(0, 3).map((cert) => (
          <Badge key={cert} variant="outline" className="text-xs">
            {cert}
          </Badge>
        ))}
      </div>

      {/* Blockers indicator */}
      {blockers.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <AlertTriangle
                className={cn(
                  'h-4 w-4',
                  blockers.some((b) => b.severity === 'blocker')
                    ? 'text-red-500'
                    : 'text-yellow-500'
                )}
              />
            </TooltipTrigger>
            <TooltipContent>
              <ul className="text-xs space-y-1">
                {blockers.map((b, i) => (
                  <li key={i}>{b.description}</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Score */}
      <div
        className={cn(
          'px-3 py-1 rounded-full text-sm font-semibold',
          getRecommendationColor(recommendation)
        )}
      >
        {total_score}
      </div>

      {/* Action */}
      <Button
        variant={isInShortlist ? 'ghost' : 'outline'}
        size="sm"
        onClick={onAddToShortlist}
        disabled={isInShortlist}
      >
        {isInShortlist ? <Check className="h-4 w-4" /> : '+'}
      </Button>
    </div>
  )
}
