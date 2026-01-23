'use client'

import { use, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { notFound, useRouter } from 'next/navigation'
import { useCandidate, useUpdateCandidateRating, useUpdateCandidateTags, useAddCandidateToPool, useRemoveCandidateFromPool, usePools } from '@/hooks'
import { useUploadCandidateCv, calculateProfileCompleteness, useArchiveCandidate } from '@/hooks/use-candidate'
import { getCvSignedUrl } from '@/hooks/use-inbox'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/command/page-header'
import { SignalLight, getSignalStatus } from '@/components/command/signal-light'
import { MatchScoreBar } from '@/components/command/match-score-bar'
import {
  Star,
  Phone,
  Mail,
  FileText,
  Briefcase,
  Download,
  Upload,
  Loader2,
  Edit,
  Target,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  MapPin,
  Calendar,
  Award,
  History,
  User,
  Building,
  Anchor,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AvailabilityStatus, ComplianceStatus } from '@/types'
import { format, formatDistanceToNow, differenceInDays } from 'date-fns'
import { nb } from 'date-fns/locale'

interface PageProps {
  params: Promise<{ id: string }>
}

const availabilityLabels: Record<AvailabilityStatus, string> = {
  available: 'Tilgjengelig',
  available_soon: 'Snart tilgjengelig',
  on_assignment: 'På oppdrag',
  unavailable: 'Utilgjengelig',
  inactive: 'Inaktiv',
}

const complianceConfig: Record<ComplianceStatus, { label: string; icon: typeof CheckCircle; signalStatus: 'available' | 'available_soon' | 'unavailable' | 'inactive' }> = {
  not_started: { label: 'Ikke startet', icon: Clock, signalStatus: 'inactive' },
  documents_pending: { label: 'Dokumenter mangler', icon: AlertTriangle, signalStatus: 'available_soon' },
  review_pending: { label: 'Under vurdering', icon: Clock, signalStatus: 'available_soon' },
  approved: { label: 'Godkjent', icon: CheckCircle, signalStatus: 'available' },
  expired: { label: 'Utløpt', icon: XCircle, signalStatus: 'unavailable' },
  rejected: { label: 'Avvist', icon: XCircle, signalStatus: 'unavailable' },
}

export default function CandidateProfilePage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { data: candidate, isLoading, error } = useCandidate(id)
  const [isDownloadingCv, setIsDownloadingCv] = useState(false)
  const uploadCv = useUploadCandidateCv()
  const archiveCandidate = useArchiveCandidate()
  const addToPool = useAddCandidateToPool()
  const removeFromPool = useRemoveCandidateFromPool()
  const { data: pools } = usePools()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === 'e' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        router.push(`/candidates/${id}/edit`)
      }
      if (e.key === 'm' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        toast.info('Quick Match kommer snart')
      }
      if (e.key === 'c' && !e.metaKey && !e.ctrlKey && candidate?.phone) {
        e.preventDefault()
        window.location.href = `tel:${candidate.phone}`
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [id, router, candidate])

  const handleArchive = async () => {
    if (!candidate) return
    if (!confirm(`Er du sikker på at du vil arkivere ${candidate.first_name}?`)) return

    try {
      await archiveCandidate.mutateAsync(candidate.id)
      toast.success('Kandidat arkivert')
      router.push('/candidates')
    } catch {
      toast.error('Kunne ikke arkivere kandidat')
    }
  }

  const handleAddToFavorites = async () => {
    if (!candidate) return
    const favPool = pools?.find(p => p.slug === 'favoritter')
    if (!favPool) {
      toast.error('Favoritter-pool ikke funnet')
      return
    }
    try {
      await addToPool.mutateAsync({ candidateId: candidate.id, poolId: favPool.id })
      toast.success('Lagt til i favoritter')
    } catch {
      toast.error('Kunne ikke legge til i favoritter')
    }
  }

  const handleRemoveFromPool = async (poolId: string, poolName: string) => {
    if (!candidate) return
    try {
      await removeFromPool.mutateAsync({ candidateId: candidate.id, poolId })
      toast.success(`Fjernet fra ${poolName}`)
    } catch {
      toast.error('Kunne ikke fjerne fra pool')
    }
  }

  const handleDownloadCv = async () => {
    if (!candidate?._raw?.cv_file_path && !candidate?.cv_key) {
      toast.error('Ingen CV tilgjengelig')
      return
    }

    setIsDownloadingCv(true)
    try {
      const cvKey = candidate._raw?.cv_file_path || candidate.cv_key
      const url = await getCvSignedUrl(cvKey!)
      if (url) {
        window.open(url, '_blank')
      } else {
        toast.error('Kunne ikke hente CV')
      }
    } catch (err) {
      toast.error('Feil ved nedlasting av CV')
      console.error(err)
    } finally {
      setIsDownloadingCv(false)
    }
  }

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !candidate) return

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Kun PDF og Word-dokumenter er tillatt')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Filen er for stor (maks 10MB)')
      return
    }

    try {
      await uploadCv.mutateAsync({ profileId: candidate.id, file })
      toast.success('CV lastet opp!')
    } catch (err) {
      toast.error('Kunne ikke laste opp CV')
      console.error(err)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (isLoading) {
    return <CandidateProfileSkeleton />
  }

  if (error || !candidate) {
    notFound()
  }

  const availability = candidate.availability_status as AvailabilityStatus || 'available'
  const compliance = complianceConfig[candidate.compliance_status as keyof typeof complianceConfig] || complianceConfig.not_started
  const ComplianceIcon = compliance.icon
  const raw = candidate._raw
  const hasCv = !!raw?.cv_file_path || !!candidate.cv_key
  const { score: profileScore, missing: missingFields } = calculateProfileCompleteness(candidate)

  const firstInitial = candidate.first_name?.[0] || ''
  const lastInitial = candidate.last_name?.[0] || ''
  const initials = (firstInitial + lastInitial).toUpperCase() || '??'

  // Format candidate ID
  const displayId = `#BC-${id.slice(0, 4).toUpperCase()}`

  // Get certification stats
  const activeCerts = candidate.certifications?.filter(c => !c.expiry_date || new Date(c.expiry_date) > new Date()) || []
  const expiringCerts = candidate.certifications?.filter(c => {
    if (!c.expiry_date) return false
    const daysUntil = differenceInDays(new Date(c.expiry_date), new Date())
    return daysUntil > 0 && daysUntil <= 90
  }) || []
  const expiredCerts = candidate.certifications?.filter(c => c.expiry_date && new Date(c.expiry_date) < new Date()) || []

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* Background gradient */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_transparent_55%),radial-gradient(circle_at_25%_35%,_rgba(160,133,99,0.12),_transparent_45%)]" />

      {/* Intel Briefing Header */}
      <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <PageHeader
            coordinates={[
              { label: 'COMMAND', href: '/' },
              { label: 'PERSONELL', href: '/candidates' },
              { label: 'INTEL BRIEFING' },
            ]}
            title=""
            systemStatus="live"
            className="mb-0 p-0 bg-transparent border-0 backdrop-blur-none"
          />

          {/* Name + Signal Light + ID */}
          <div className="flex items-center gap-4 mt-4">
            <SignalLight
              status={getSignalStatus(availability)}
              size="lg"
              className="w-4 h-4"
            />
            <h1 className="text-3xl font-bold tracking-tight">
              {candidate.first_name} {candidate.last_name}
            </h1>
            <span className="text-tactical text-gold-400 font-mono text-lg">
              {displayId}
            </span>
            <Badge
              variant="outline"
              className="ml-2 border-gold-500/30 bg-gold-500/10 text-gold-400 text-tactical"
            >
              {availabilityLabels[availability]}
            </Badge>
          </div>

          <p className="text-muted-foreground mt-1 text-sm">
            {candidate.primary_role}
            {candidate.secondary_roles?.length > 0 && ` / ${candidate.secondary_roles.join(', ')}`}
          </p>
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-10 gap-6">

          {/* Left Column - Profile Summary (30%) */}
          <div className="col-span-3 space-y-4">

            {/* Profile Card */}
            <div className="glass-panel rounded-xl p-5 card-tactical">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 ring-2 ring-gold-500/30 mb-4">
                  <AvatarImage src={candidate.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl bg-navy-800 text-gold-400">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {candidate.internal_rating && (
                  <div className="flex items-center gap-1.5 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          'h-4 w-4',
                          star <= candidate.internal_rating!
                            ? 'text-gold-400 fill-gold-400'
                            : 'text-slate-600'
                        )}
                      />
                    ))}
                  </div>
                )}

                {/* Contact Info */}
                <div className="w-full space-y-2 mt-2">
                  {candidate.email && (
                    <a
                      href={`mailto:${candidate.email}`}
                      className="flex items-center gap-2 text-sm text-slate-300 hover:text-gold-400 transition-colors"
                    >
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate">{candidate.email}</span>
                    </a>
                  )}
                  {candidate.phone && (
                    <a
                      href={`tel:${candidate.phone}`}
                      className="flex items-center gap-2 text-sm text-slate-300 hover:text-gold-400 transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{candidate.phone}</span>
                    </a>
                  )}
                  {candidate._raw?.address_city && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{candidate._raw.address_city}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Metrics Footer */}
              <div className="metrics-footer -mx-5 -mb-5 mt-5 p-4 rounded-b-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-tactical text-muted-foreground text-[10px] mb-1">ERFARING</div>
                    <div className="text-lg font-semibold text-gold-400 font-mono">
                      {candidate.experience_years || 0}<span className="text-xs text-muted-foreground ml-1">ÅR</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-tactical text-muted-foreground text-[10px] mb-1">PROFIL</div>
                    <div className="text-lg font-semibold font-mono">
                      <span className={cn(
                        profileScore >= 70 ? 'text-emerald-400' :
                        profileScore >= 40 ? 'text-amber-400' : 'text-rose-400'
                      )}>
                        {profileScore}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-tactical text-muted-foreground text-[10px] mb-1">SERTIFIKATER</div>
                    <div className="text-lg font-semibold text-gold-400 font-mono">
                      {activeCerts.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-tactical text-muted-foreground text-[10px] mb-1">COMPLIANCE</div>
                    <div className="flex items-center gap-1.5">
                      <SignalLight status={compliance.signalStatus} size="sm" />
                      <span className="text-xs text-slate-300">{compliance.label}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Certification Badges */}
            {activeCerts.length > 0 && (
              <div className="glass-panel rounded-xl p-4 card-tactical">
                <div className="text-tactical text-muted-foreground text-[10px] mb-3">KLARERING</div>
                <div className="flex flex-wrap gap-2">
                  {activeCerts.slice(0, 6).map((cert) => (
                    <Badge
                      key={cert.id}
                      variant="outline"
                      className="border-gold-500/20 bg-gold-500/5 text-gold-300 text-xs"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {cert.code}
                    </Badge>
                  ))}
                  {activeCerts.length > 6 && (
                    <Badge variant="outline" className="border-slate-500/20 text-slate-400 text-xs">
                      +{activeCerts.length - 6}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Pools */}
            {candidate.pools && candidate.pools.length > 0 && (
              <div className="glass-panel rounded-xl p-4 card-tactical">
                <div className="text-tactical text-muted-foreground text-[10px] mb-3">POOLS</div>
                <div className="space-y-2">
                  {candidate.pools.map((pool) => (
                    <div
                      key={pool.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/5 group"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: pool.color }}
                        />
                        <span className="text-sm">{pool.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        onClick={() => handleRemoveFromPool(pool.id, pool.name)}
                      >
                        <XCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {candidate.tags && candidate.tags.length > 0 && (
              <div className="glass-panel rounded-xl p-4 card-tactical">
                <div className="text-tactical text-muted-foreground text-[10px] mb-3">TAGS</div>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs bg-white/5">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Tabbed Content (70%) */}
          <div className="col-span-7">
            <Tabs defaultValue="clearance" className="w-full">
              <TabsList className="w-full justify-start bg-white/5 border border-white/10 p-1 h-auto">
                <TabsTrigger value="clearance" className="text-tactical data-[state=active]:bg-gold-500/20 data-[state=active]:text-gold-400">
                  <Shield className="h-3.5 w-3.5 mr-1.5" />
                  KLARERING
                </TabsTrigger>
                <TabsTrigger value="intel" className="text-tactical data-[state=active]:bg-gold-500/20 data-[state=active]:text-gold-400">
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  INTEL
                </TabsTrigger>
                <TabsTrigger value="documents" className="text-tactical data-[state=active]:bg-gold-500/20 data-[state=active]:text-gold-400">
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  DOKUMENTER
                </TabsTrigger>
                <TabsTrigger value="mission-log" className="text-tactical data-[state=active]:bg-gold-500/20 data-[state=active]:text-gold-400">
                  <History className="h-3.5 w-3.5 mr-1.5" />
                  MISSION LOG
                </TabsTrigger>
              </TabsList>

              {/* Clearance Tab - Certification Grid */}
              <TabsContent value="clearance" className="mt-4">
                <div className="glass-panel rounded-xl p-5 card-tactical">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-tactical text-muted-foreground">CLEARANCE CARDS</div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1.5">
                        <SignalLight status="available" size="sm" showPulse={false} />
                        <span className="text-muted-foreground">Gyldig ({activeCerts.length})</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <SignalLight status="available_soon" size="sm" showPulse={false} />
                        <span className="text-muted-foreground">Utløper snart ({expiringCerts.length})</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <SignalLight status="unavailable" size="sm" showPulse={false} />
                        <span className="text-muted-foreground">Utløpt ({expiredCerts.length})</span>
                      </span>
                    </div>
                  </div>

                  {candidate.certifications && candidate.certifications.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {candidate.certifications.map((cert) => {
                        const isExpired = cert.expiry_date && new Date(cert.expiry_date) < new Date()
                        const isExpiringSoon = cert.expiry_date && !isExpired && differenceInDays(new Date(cert.expiry_date), new Date()) <= 90

                        let signalStatus: 'available' | 'available_soon' | 'unavailable' = 'available'
                        if (isExpired) signalStatus = 'unavailable'
                        else if (isExpiringSoon) signalStatus = 'available_soon'

                        return (
                          <div
                            key={cert.id}
                            className={cn(
                              'relative p-4 rounded-lg border card-tactical',
                              'bg-slate-900/50',
                              isExpired && 'border-red-500/30 bg-red-950/20',
                              isExpiringSoon && !isExpired && 'border-amber-500/30 bg-amber-950/20'
                            )}
                          >
                            <div className="absolute top-3 right-3">
                              <SignalLight status={signalStatus} size="sm" />
                            </div>

                            <div className="pr-6">
                              <div className="text-tactical text-gold-400 text-sm font-semibold">
                                {cert.code}
                              </div>
                              <div className="text-sm text-slate-300 mt-1">
                                {cert.name}
                              </div>
                              {cert.issuer && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {cert.issuer}
                                </div>
                              )}
                            </div>

                            <div className="mt-3 pt-3 border-t border-white/5">
                              {cert.expiry_date ? (
                                <div className="flex items-center justify-between">
                                  <span className="text-coordinates">UTLØPER</span>
                                  <span className={cn(
                                    'font-mono text-xs',
                                    isExpired ? 'text-red-400' :
                                    isExpiringSoon ? 'text-amber-400' : 'text-slate-400'
                                  )}>
                                    {format(new Date(cert.expiry_date), 'dd.MM.yyyy')}
                                  </span>
                                </div>
                              ) : cert.is_permanent ? (
                                <div className="flex items-center justify-between">
                                  <span className="text-coordinates">STATUS</span>
                                  <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
                                    PERMANENT
                                  </Badge>
                                </div>
                              ) : null}

                              {cert.document_verified && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-emerald-400">
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Verifisert</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Shield className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>Ingen sertifikater registrert</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Intel Tab */}
              <TabsContent value="intel" className="mt-4 space-y-4">
                {/* CV Summary */}
                {candidate.cv_summary && (
                  <div className="glass-panel rounded-xl p-5 card-tactical">
                    <div className="text-tactical text-muted-foreground mb-3">CV SAMMENDRAG</div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {candidate.cv_summary}
                    </p>
                  </div>
                )}

                {/* Experience & Sectors */}
                <div className="glass-panel rounded-xl p-5 card-tactical">
                  <div className="text-tactical text-muted-foreground mb-4">ERFARING & KOMPETANSE</div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="h-4 w-4 text-gold-400" />
                        <span className="text-sm font-medium">Total erfaring</span>
                      </div>
                      <div className="text-2xl font-bold text-gold-400 font-mono">
                        {candidate.experience_years || 0} <span className="text-sm text-muted-foreground">år</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Anchor className="h-4 w-4 text-gold-400" />
                        <span className="text-sm font-medium">Primær rolle</span>
                      </div>
                      <div className="text-sm text-slate-300">
                        {candidate.primary_role || 'Ikke angitt'}
                      </div>
                    </div>
                  </div>

                  {candidate.secondary_roles && candidate.secondary_roles.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="text-xs text-muted-foreground mb-2">SEKUNDÆRE ROLLER</div>
                      <div className="flex flex-wrap gap-2">
                        {candidate.secondary_roles.map((role) => (
                          <Badge key={role} variant="outline" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {candidate.sectors && candidate.sectors.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="text-xs text-muted-foreground mb-2">SEKTORER</div>
                      <div className="flex flex-wrap gap-2">
                        {candidate.sectors.map((sector) => (
                          <Badge key={sector} variant="secondary" className="text-xs bg-white/5">
                            {sector}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Availability Details */}
                <div className="glass-panel rounded-xl p-5 card-tactical">
                  <div className="text-tactical text-muted-foreground mb-4">TILGJENGELIGHET</div>

                  <div className="flex items-center gap-3 mb-4">
                    <SignalLight status={getSignalStatus(availability)} size="lg" />
                    <div>
                      <div className="font-medium">{availabilityLabels[availability]}</div>
                      {candidate.availability_date && (
                        <div className="text-sm text-muted-foreground">
                          Fra {format(new Date(candidate.availability_date), 'dd.MM.yyyy', { locale: nb })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Compliance */}
                  <div className="pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ComplianceIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Compliance status</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <SignalLight status={compliance.signalStatus} size="sm" />
                        <span className="text-sm">{compliance.label}</span>
                      </div>
                    </div>
                    {raw?.compliance_checked_at && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Sist sjekket: {format(new Date(raw.compliance_checked_at), 'dd.MM.yyyy')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Internal Notes */}
                {candidate.internal_notes && (
                  <div className="glass-panel rounded-xl p-5 card-tactical">
                    <div className="text-tactical text-muted-foreground mb-3">INTERNE NOTATER</div>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">
                      {candidate.internal_notes}
                    </p>
                  </div>
                )}

                {/* Metadata */}
                <div className="glass-panel rounded-xl p-5 card-tactical">
                  <div className="text-tactical text-muted-foreground mb-3">METADATA</div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    {raw?.created_at && (
                      <div>
                        <div className="text-coordinates mb-1">OPPRETTET</div>
                        <div className="font-mono text-slate-300">
                          {format(new Date(raw.created_at), 'dd.MM.yyyy')}
                        </div>
                      </div>
                    )}
                    {raw?.updated_at && (
                      <div>
                        <div className="text-coordinates mb-1">SIST OPPDATERT</div>
                        <div className="font-mono text-slate-300">
                          {format(new Date(raw.updated_at), 'dd.MM.yyyy')}
                        </div>
                      </div>
                    )}
                    {raw?.source && (
                      <div>
                        <div className="text-coordinates mb-1">KILDE</div>
                        <div className="text-slate-300">{raw.source}</div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="mt-4">
                <div className="glass-panel rounded-xl p-5 card-tactical">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-tactical text-muted-foreground">DOKUMENTARKIV</div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleCvUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadCv.isPending}
                      className="text-tactical"
                    >
                      {uploadCv.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      LAST OPP
                    </Button>
                  </div>

                  {/* CV Card */}
                  <div className={cn(
                    'p-4 rounded-lg border card-tactical mb-4',
                    hasCv ? 'border-gold-500/20 bg-gold-500/5' : 'border-dashed border-slate-600'
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'p-2 rounded-lg',
                          hasCv ? 'bg-gold-500/10' : 'bg-slate-800'
                        )}>
                          <FileText className={cn(
                            'h-5 w-5',
                            hasCv ? 'text-gold-400' : 'text-slate-500'
                          )} />
                        </div>
                        <div>
                          <div className="font-medium">Curriculum Vitae</div>
                          <div className="text-xs text-muted-foreground">
                            {hasCv ? 'PDF/DOC tilgjengelig' : 'Ikke lastet opp'}
                          </div>
                        </div>
                      </div>
                      {hasCv && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadCv}
                          disabled={isDownloadingCv}
                          className="text-tactical"
                        >
                          {isDownloadingCv ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          ÅPNE
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Other Documents */}
                  {candidate.documents && candidate.documents.length > 0 ? (
                    <div className="space-y-2">
                      {candidate.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">{doc.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {doc.type} - {format(new Date(doc.uploaded_at), 'dd.MM.yyyy')}
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" className="text-tactical">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : !hasCv && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>Ingen dokumenter lastet opp</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Mission Log Tab */}
              <TabsContent value="mission-log" className="mt-4">
                <div className="glass-panel rounded-xl p-5 card-tactical">
                  <div className="text-tactical text-muted-foreground mb-4">OPPDRAGSLOGG</div>

                  {/* Mission Timeline */}
                  <div className="relative">
                    {/* Vertical gold line */}
                    <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-gold-500 via-gold-500/50 to-transparent" />

                    {/* Timeline entries - placeholder for now */}
                    <div className="space-y-4">
                      {raw?.created_at && (
                        <div className="relative flex gap-4 pl-8">
                          <div className="absolute left-0 top-1">
                            <div className="h-[22px] w-[22px] rounded-full bg-slate-900 border-2 border-gold-500 flex items-center justify-center">
                              <User className="h-3 w-3 text-gold-400" />
                            </div>
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-sm font-medium">Profil opprettet</span>
                              <span className="text-coordinates">
                                {format(new Date(raw.created_at), 'dd.MM.yyyy HH:mm')}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Kandidat registrert i systemet
                              {raw.source && ` via ${raw.source}`}
                            </p>
                          </div>
                        </div>
                      )}

                      {raw?.updated_at && raw.updated_at !== raw.created_at && (
                        <div className="relative flex gap-4 pl-8">
                          <div className="absolute left-0 top-1">
                            <div className="h-[22px] w-[22px] rounded-full bg-slate-900 border-2 border-slate-600 flex items-center justify-center">
                              <Edit className="h-3 w-3 text-slate-400" />
                            </div>
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-sm font-medium">Profil oppdatert</span>
                              <span className="text-coordinates">
                                {format(new Date(raw.updated_at), 'dd.MM.yyyy HH:mm')}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Siste endring i kandidatprofil
                            </p>
                          </div>
                        </div>
                      )}

                      {raw?.compliance_checked_at && (
                        <div className="relative flex gap-4 pl-8">
                          <div className="absolute left-0 top-1">
                            <div className="h-[22px] w-[22px] rounded-full bg-slate-900 border-2 border-emerald-500 flex items-center justify-center">
                              <CheckCircle className="h-3 w-3 text-emerald-400" />
                            </div>
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-sm font-medium">Compliance sjekket</span>
                              <span className="text-coordinates">
                                {format(new Date(raw.compliance_checked_at), 'dd.MM.yyyy HH:mm')}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Status: {compliance.label}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* No history placeholder */}
                      {!raw?.created_at && (
                        <div className="text-center py-8 text-muted-foreground">
                          <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
                          <p>Ingen historikk tilgjengelig</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="glass-panel border-t border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link href="/candidates">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    Tilbake
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddToFavorites}
                  className="text-tactical"
                >
                  <Star className="h-3.5 w-3.5 mr-1.5" />
                  FAVORITT
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => candidate.phone && (window.location.href = `tel:${candidate.phone}`)}
                  disabled={!candidate.phone}
                  className="text-tactical"
                >
                  <Phone className="h-3.5 w-3.5 mr-1.5" />
                  RING
                  <kbd className="ml-2 px-1.5 py-0.5 text-[10px] bg-white/10 rounded">C</kbd>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-tactical"
                  onClick={() => toast.info('Quick Match kommer snart')}
                >
                  <Target className="h-3.5 w-3.5 mr-1.5" />
                  MATCH
                  <kbd className="ml-2 px-1.5 py-0.5 text-[10px] bg-white/10 rounded">M</kbd>
                </Button>

                <Link href={`/candidates/${id}/edit`}>
                  <Button
                    size="sm"
                    className="btn-gold text-tactical"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    REDIGER
                    <kbd className="ml-2 px-1.5 py-0.5 text-[10px] bg-black/20 rounded">E</kbd>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CandidateProfileSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Skeleton className="h-4 w-48 bg-slate-800 mb-4" />
          <div className="flex items-center gap-4 mt-4">
            <Skeleton className="h-4 w-4 rounded-full bg-slate-800" />
            <Skeleton className="h-9 w-64 bg-slate-800" />
            <Skeleton className="h-6 w-24 bg-slate-800" />
          </div>
          <Skeleton className="h-4 w-48 bg-slate-800 mt-2" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-10 gap-6">
          <div className="col-span-3 space-y-4">
            <Skeleton className="h-80 w-full rounded-xl bg-slate-800" />
            <Skeleton className="h-24 w-full rounded-xl bg-slate-800" />
          </div>
          <div className="col-span-7">
            <Skeleton className="h-12 w-full bg-slate-800 rounded-lg mb-4" />
            <Skeleton className="h-96 w-full rounded-xl bg-slate-800" />
          </div>
        </div>
      </div>
    </div>
  )
}
