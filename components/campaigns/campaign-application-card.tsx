'use client'

import { useState, useMemo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { nb } from 'date-fns/locale'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Mail,
  Phone,
  Clock,
  FileText,
  Download,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  StickyNote,
  Loader2,
  Briefcase,
  Award,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import type { CampaignApplication, CampaignStatus } from '@/types/campaign'
import {
  getPositionConfig,
  getSegmentConfig,
  getStatusConfig,
  STATUS_OPTIONS,
} from '@/lib/utils/campaign-constants'
import {
  useUpdateCampaignStatus,
  useUpdateCampaignNotes,
  getCvSignedUrl,
} from '@/hooks/use-campaign-applications'

// ═══════════════════════════════════════════════════════
// NOTES PARSING - Campaign form data from Bluecrew
// ═══════════════════════════════════════════════════════

interface CampaignNotes {
  erfaring?: string           // "0-2", "3-5", "6-10", "10+"
  offshoreErfaring?: string   // "ja", "noe", "nei"
  rovRolle?: string           // ROV-specific
  sertifikater?: string       // Certifications
  fagomrade?: string          // Field/specialty
  coverLetter?: string        // Application text
  extra_document_url?: string
  extra_document_filename?: string
}

function parseNotes(notes: string | null): CampaignNotes | null {
  if (!notes) return null
  
  // If it's already an object (shouldn't happen but just in case)
  if (typeof notes === 'object') return notes as CampaignNotes
  
  // Try to parse JSON
  try {
    return JSON.parse(notes) as CampaignNotes
  } catch {
    // If not valid JSON, return null (it's just plain text notes)
    return null
  }
}

const ERFARING_LABELS: Record<string, string> = {
  '0-2': '0-2 år',
  '3-5': '3-5 år',
  '6-10': '6-10 år',
  '10+': '10+ år',
}

const OFFSHORE_ERFARING_LABELS: Record<string, string> = {
  'ja': 'Ja, offshore erfaring',
  'noe': 'Noe erfaring',
  'nei': 'Ingen offshore erfaring',
}

interface CampaignApplicationCardProps {
  application: CampaignApplication
  compact?: boolean
}

export function CampaignApplicationCard({
  application: app,
  compact = false,
}: CampaignApplicationCardProps) {
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)
  const [internalNotes, setInternalNotes] = useState('')
  
  const updateStatus = useUpdateCampaignStatus()
  const updateNotes = useUpdateCampaignNotes()

  const positionConfig = getPositionConfig(app.position)
  const segmentConfig = getSegmentConfig(app.segment)
  const statusConfig = getStatusConfig(app.status)

  // Parse notes JSON from campaign form
  const parsedNotes = useMemo(() => parseNotes(app.notes), [app.notes])
  const isJsonNotes = parsedNotes !== null

  const PositionIcon = positionConfig.icon
  const SegmentIcon = segmentConfig.icon

  const handleStatusChange = async (newStatus: CampaignStatus) => {
    try {
      await updateStatus.mutateAsync({ id: app.id, status: newStatus })
      toast.success('Status oppdatert', {
        description: `${app.name} er nå "${getStatusConfig(newStatus).label}"`,
      })
    } catch (error) {
      toast.error('Kunne ikke oppdatere status', {
        description: 'Prøv igjen senere',
      })
    }
  }

  const handleSaveNotes = async () => {
    try {
      await updateNotes.mutateAsync({ id: app.id, notes: internalNotes })
      toast.success('Notater lagret')
      setNotesDialogOpen(false)
    } catch (error) {
      toast.error('Kunne ikke lagre notater')
    }
  }

  const handleDownloadCV = async () => {
    if (!app.cv_url) {
      toast.error('Ingen CV tilgjengelig')
      return
    }

    try {
      const url = await getCvSignedUrl(app.cv_url)
      if (url) {
        window.open(url, '_blank')
      } else {
        toast.error('Kunne ikke laste ned CV')
      }
    } catch (error) {
      toast.error('Kunne ikke laste ned CV')
    }
  }

  return (
    <>
      <Card className={cn('hover:bg-muted/50 transition-colors', compact && 'shadow-sm')}>
        <CardContent className={cn('pt-4', compact && 'py-3')}>
          <div className="flex items-start gap-3">
            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start gap-2 flex-wrap">
                <h4 className="font-medium truncate">{app.name}</h4>
                
                {/* Status Badge */}
                <Badge
                  variant="secondary"
                  className={cn('text-xs', statusConfig.bgColor, statusConfig.textColor)}
                >
                  {statusConfig.label}
                </Badge>

                {/* Position Badge */}
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <PositionIcon className="h-3 w-3" />
                  {positionConfig.label}
                </Badge>

                {/* Segment Badge */}
                <Badge
                  variant="secondary"
                  className={cn('text-xs flex items-center gap-1', segmentConfig.bgColor, segmentConfig.textColor)}
                >
                  <SegmentIcon className="h-3 w-3" />
                  {segmentConfig.labelNo}
                </Badge>

                {/* Verified Indicator */}
                {app.candidate_id && (
                  <Badge variant="outline" className="text-xs border-green-600 text-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verifisert
                  </Badge>
                )}

                {/* CV Indicator */}
                {app.cv_url && (
                  <Badge variant="outline" className="text-xs border-blue-600 text-blue-600">
                    <FileText className="h-3 w-3 mr-1" />
                    CV
                  </Badge>
                )}
              </div>

              {/* Contact Info */}
              {!compact && (
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {app.email}
                  </span>
                  {app.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {app.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(app.created_at), {
                      addSuffix: true,
                      locale: nb,
                    })}
                  </span>
                </div>
              )}

              {/* Application Details from Notes */}
              {!compact && parsedNotes && (
                <div className="mt-3 space-y-2">
                  {/* Experience & Offshore Experience */}
                  <div className="flex items-center gap-3 flex-wrap text-sm">
                    {parsedNotes.erfaring && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Briefcase className="h-3 w-3" />
                        {ERFARING_LABELS[parsedNotes.erfaring] || parsedNotes.erfaring}
                      </span>
                    )}
                    {parsedNotes.offshoreErfaring && (
                      <Badge variant="outline" className="text-xs">
                        {OFFSHORE_ERFARING_LABELS[parsedNotes.offshoreErfaring] || parsedNotes.offshoreErfaring}
                      </Badge>
                    )}
                    {parsedNotes.sertifikater && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Award className="h-3 w-3" />
                        {parsedNotes.sertifikater}
                      </span>
                    )}
                    {parsedNotes.fagomrade && (
                      <Badge variant="secondary" className="text-xs">
                        {parsedNotes.fagomrade}
                      </Badge>
                    )}
                    {parsedNotes.rovRolle && (
                      <Badge variant="secondary" className="text-xs">
                        ROV: {parsedNotes.rovRolle}
                      </Badge>
                    )}
                  </div>

                  {/* Cover Letter Preview */}
                  {parsedNotes.coverLetter && (
                    <div className="bg-muted/50 rounded-md p-2">
                      <p className="text-sm text-muted-foreground line-clamp-2 flex items-start gap-1">
                        <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{parsedNotes.coverLetter}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Plain text notes fallback (if not JSON) */}
              {!compact && app.notes && !isJsonNotes && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  💬 {app.notes}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Download CV Button */}
              {app.cv_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadCV}
                  title="Last ned CV"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}

              {/* Status Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    disabled={updateStatus.isPending}
                    className={cn(
                      statusConfig.bgColor,
                      statusConfig.textColor,
                      'border-0'
                    )}
                  >
                    {updateStatus.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      statusConfig.label
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Endre status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {STATUS_OPTIONS.map((status) => (
                    <DropdownMenuItem
                      key={status.value}
                      onClick={() => handleStatusChange(status.value)}
                      disabled={status.value === app.status}
                    >
                      <Badge
                        variant="secondary"
                        className={cn('text-xs mr-2', status.bgColor, status.textColor)}
                      >
                        {status.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {status.description}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* More Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {app.candidate_id && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href={`/candidates/${app.candidate_id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Se kandidatprofil
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => setNotesDialogOpen(true)}>
                    <StickyNote className="h-4 w-4 mr-2" />
                    {app.notes ? 'Rediger notater' : 'Legg til notater'}
                  </DropdownMenuItem>
                  {app.cv_url && (
                    <DropdownMenuItem onClick={handleDownloadCV}>
                      <Download className="h-4 w-4 mr-2" />
                      Last ned CV
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Details Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Søknadsdetaljer - {app.name}</DialogTitle>
            <DialogDescription>
              Informasjon fra kampanjeskjema
            </DialogDescription>
          </DialogHeader>
          
          {/* Show parsed application data */}
          {parsedNotes && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <h4 className="font-medium text-sm">Søknadsinformasjon</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {parsedNotes.erfaring && (
                  <div>
                    <span className="text-muted-foreground">Erfaring:</span>
                    <span className="ml-2 font-medium">{ERFARING_LABELS[parsedNotes.erfaring] || parsedNotes.erfaring}</span>
                  </div>
                )}
                {parsedNotes.offshoreErfaring && (
                  <div>
                    <span className="text-muted-foreground">Offshore:</span>
                    <span className="ml-2 font-medium">{OFFSHORE_ERFARING_LABELS[parsedNotes.offshoreErfaring] || parsedNotes.offshoreErfaring}</span>
                  </div>
                )}
                {parsedNotes.sertifikater && (
                  <div>
                    <span className="text-muted-foreground">Sertifikater:</span>
                    <span className="ml-2 font-medium">{parsedNotes.sertifikater}</span>
                  </div>
                )}
                {parsedNotes.fagomrade && (
                  <div>
                    <span className="text-muted-foreground">Fagområde:</span>
                    <span className="ml-2 font-medium">{parsedNotes.fagomrade}</span>
                  </div>
                )}
                {parsedNotes.rovRolle && (
                  <div>
                    <span className="text-muted-foreground">ROV Rolle:</span>
                    <span className="ml-2 font-medium">{parsedNotes.rovRolle}</span>
                  </div>
                )}
              </div>
              
              {parsedNotes.coverLetter && (
                <div>
                  <span className="text-muted-foreground text-sm">Søknadstekst:</span>
                  <p className="mt-1 text-sm bg-background p-3 rounded border">
                    {parsedNotes.coverLetter}
                  </p>
                </div>
              )}

              {parsedNotes.extra_document_url && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Ekstra dokument: {parsedNotes.extra_document_filename || 'Vedlegg'}</span>
                </div>
              )}
            </div>
          )}

          {/* Internal notes section */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Interne notater</h4>
            <Textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Skriv interne notater her (kun synlig for ansatte)..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
              Lukk
            </Button>
            <Button onClick={handleSaveNotes} disabled={updateNotes.isPending}>
              {updateNotes.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Lagre notater
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
