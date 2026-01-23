'use client'

import { use, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { notFound, useRouter } from 'next/navigation'
import { useCandidate, useAddCandidateToPool, useRemoveCandidateFromPool, usePools } from '@/hooks'
import { useUploadCandidateCv, calculateProfileCompleteness, useArchiveCandidate } from '@/hooks/use-candidate'
import { getCvSignedUrl } from '@/hooks/use-inbox'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
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
  Anchor,
  ChevronLeft,
  ExternalLink,
  MoreHorizontal,
  Copy,
  Trash2,
  Heart,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { AvailabilityStatus, ComplianceStatus } from '@/types'
import { format, differenceInDays } from 'date-fns'
import { nb } from 'date-fns/locale'

interface PageProps {
  params: Promise<{ id: string }>
}

const availabilityConfig: Record<AvailabilityStatus, { label: string; color: string; bg: string }> = {
  available: { label: 'Tilgjengelig', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  available_soon: { label: 'Snart tilgjengelig', color: 'text-amber-700', bg: 'bg-amber-50' },
  on_assignment: { label: 'På oppdrag', color: 'text-blue-700', bg: 'bg-blue-50' },
  unavailable: { label: 'Utilgjengelig', color: 'text-muted-foreground', bg: 'bg-muted' },
  inactive: { label: 'Inaktiv', color: 'text-muted-foreground', bg: 'bg-muted' },
}

const complianceConfig: Record<ComplianceStatus, { label: string; icon: typeof CheckCircle; color: string; bg: string }> = {
  not_started: { label: 'Ikke startet', icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted' },
  documents_pending: { label: 'Dokumenter mangler', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  review_pending: { label: 'Under vurdering', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  approved: { label: 'Godkjent', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  expired: { label: 'Utløpt', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  rejected: { label: 'Avvist', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} kopiert`)
  }

  if (isLoading) {
    return <CandidateProfileSkeleton />
  }

  if (error || !candidate) {
    notFound()
  }

  const availability = availabilityConfig[candidate.availability_status as AvailabilityStatus] || availabilityConfig.available
  const compliance = complianceConfig[candidate.compliance_status as keyof typeof complianceConfig] || complianceConfig.not_started
  const ComplianceIcon = compliance.icon
  const raw = candidate._raw
  const hasCv = !!raw?.cv_file_path || !!candidate.cv_key
  const { score: profileScore } = calculateProfileCompleteness(candidate)

  const firstInitial = candidate.first_name?.[0] || ''
  const lastInitial = candidate.last_name?.[0] || ''
  const initials = (firstInitial + lastInitial).toUpperCase() || '??'

  // Get certification stats
  const activeCerts = candidate.certifications?.filter(c => !c.expiry_date || new Date(c.expiry_date) > new Date()) || []
  const expiringCerts = candidate.certifications?.filter(c => {
    if (!c.expiry_date) return false
    const daysUntil = differenceInDays(new Date(c.expiry_date), new Date())
    return daysUntil > 0 && daysUntil <= 90
  }) || []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-6">
          {/* Back nav */}
          <div className="py-3 border-b border-border/50">
            <Link
              href="/candidates"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Kandidater
            </Link>
          </div>

          {/* Profile header */}
          <div className="py-6 flex items-start justify-between">
            <div className="flex items-center gap-5">
              <Avatar className="h-16 w-16 ring-2 ring-white shadow-lg">
                <AvatarImage src={candidate.avatar_url || undefined} />
                <AvatarFallback className="text-lg font-medium bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold text-foreground">
                    {candidate.first_name} {candidate.last_name}
                  </h1>
                  <Badge className={cn('font-medium', availability.bg, availability.color)}>
                    {availability.label}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-0.5">
                  {candidate.primary_role || 'Rolle ikke angitt'}
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {candidate.email && (
                    <button
                      onClick={() => copyToClipboard(candidate.email!, 'E-post')}
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {candidate.email}
                    </button>
                  )}
                  {candidate.phone && (
                    <a
                      href={`tel:${candidate.phone}`}
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {candidate.phone}
                    </a>
                  )}
                  {candidate._raw?.address_city && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {candidate._raw.address_city}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddToFavorites}
                className="text-muted-foreground"
              >
                <Heart className="h-4 w-4 mr-1.5" />
                Favoritt
              </Button>
              <Link href={`/candidates/${id}/edit`}>
                <Button size="sm">
                  <Edit className="h-4 w-4 mr-1.5" />
                  Rediger
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => copyToClipboard(window.location.href, 'Link')}>
                    <Copy className="h-4 w-4 mr-2" />
                    Kopier link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => candidate.phone && (window.location.href = `tel:${candidate.phone}`)}>
                    <Phone className="h-4 w-4 mr-2" />
                    Ring kandidat
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleArchive} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Arkiver
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-8">

          {/* Left Column - Stats & Quick Info */}
          <div className="space-y-6">

            {/* Profile Completion */}
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">Profil fullført</span>
                <span className="text-sm font-semibold text-foreground">{profileScore}%</span>
              </div>
              <Progress value={profileScore} className="h-2" />
            </div>

            {/* Quick Stats */}
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Oversikt</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Erfaring</span>
                  <span className="text-sm font-semibold text-foreground">
                    {candidate.experience_years || 0} år
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sertifikater</span>
                  <span className="text-sm font-semibold text-foreground">
                    {activeCerts.length} aktive
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Compliance</span>
                  <Badge className={cn('font-medium', compliance.bg, compliance.color)}>
                    {compliance.label}
                  </Badge>
                </div>
                {candidate.internal_rating && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Rating</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            'h-4 w-4',
                            star <= candidate.internal_rating!
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pools */}
            {candidate.pools && candidate.pools.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Pools</h3>
                <div className="space-y-2">
                  {candidate.pools.map((pool) => (
                    <div
                      key={pool.id}
                      className="flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: pool.color }}
                        />
                        <span className="text-sm text-foreground">{pool.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveFromPool(pool.id, pool.name)}
                      >
                        <XCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {candidate.tags && candidate.tags.length > 0 && (
              <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-muted text-foreground">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Tabbed Content */}
          <div className="col-span-2">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="bg-card border border-border p-1 h-auto rounded-lg shadow-sm mb-6">
                <TabsTrigger
                  value="profile"
                  className="data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-md px-4 py-2"
                >
                  Profil
                </TabsTrigger>
                <TabsTrigger
                  value="certifications"
                  className="data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-md px-4 py-2"
                >
                  Sertifikater
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  className="data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-md px-4 py-2"
                >
                  Dokumenter
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-slate-900 data-[state=active]:text-white rounded-md px-4 py-2"
                >
                  Historikk
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                {/* CV Summary */}
                {candidate.cv_summary && (
                  <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                    <h3 className="text-base font-semibold text-foreground mb-3">Om kandidaten</h3>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {candidate.cv_summary}
                    </p>
                  </div>
                )}

                {/* Experience */}
                <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-foreground mb-4">Erfaring & Kompetanse</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Briefcase className="h-4 w-4" />
                        <span className="text-sm">Total erfaring</span>
                      </div>
                      <p className="text-xl font-semibold text-foreground">
                        {candidate.experience_years || 0} år
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Anchor className="h-4 w-4" />
                        <span className="text-sm">Primær rolle</span>
                      </div>
                      <p className="text-foreground font-medium">
                        {candidate.primary_role || 'Ikke angitt'}
                      </p>
                    </div>
                  </div>

                  {candidate.secondary_roles && candidate.secondary_roles.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-border/50">
                      <p className="text-sm text-muted-foreground mb-2">Sekundære roller</p>
                      <div className="flex flex-wrap gap-2">
                        {candidate.secondary_roles.map((role) => (
                          <Badge key={role} variant="outline" className="bg-card">
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {candidate.sectors && candidate.sectors.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-border/50">
                      <p className="text-sm text-muted-foreground mb-2">Sektorer</p>
                      <div className="flex flex-wrap gap-2">
                        {candidate.sectors.map((sector) => (
                          <Badge key={sector} variant="secondary" className="bg-muted">
                            {sector}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Availability */}
                <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-foreground mb-4">Tilgjengelighet</h3>
                  <div className="flex items-center gap-3">
                    <div className={cn('h-3 w-3 rounded-full',
                      candidate.availability_status === 'available' ? 'bg-emerald-500' :
                      candidate.availability_status === 'available_soon' ? 'bg-amber-500' :
                      candidate.availability_status === 'on_assignment' ? 'bg-blue-500' : 'bg-muted-foreground'
                    )} />
                    <div>
                      <p className="font-medium text-foreground">{availability.label}</p>
                      {candidate.availability_date && (
                        <p className="text-sm text-muted-foreground">
                          Fra {format(new Date(candidate.availability_date), 'd. MMMM yyyy', { locale: nb })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Internal Notes */}
                {candidate.internal_notes && (
                  <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                    <h3 className="text-base font-semibold text-foreground mb-3">Interne notater</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {candidate.internal_notes}
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Certifications Tab */}
              <TabsContent value="certifications" className="space-y-6">
                <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-semibold text-foreground">Sertifikater</h3>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-muted-foreground">Gyldig ({activeCerts.length})</span>
                      </span>
                      {expiringCerts.length > 0 && (
                        <span className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full bg-amber-500" />
                          <span className="text-muted-foreground">Utløper snart ({expiringCerts.length})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {candidate.certifications && candidate.certifications.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {candidate.certifications.map((cert) => {
                        const isExpired = cert.expiry_date && new Date(cert.expiry_date) < new Date()
                        const isExpiringSoon = cert.expiry_date && !isExpired && differenceInDays(new Date(cert.expiry_date), new Date()) <= 90

                        return (
                          <div
                            key={cert.id}
                            className={cn(
                              'p-4 rounded-lg border transition-colors',
                              isExpired
                                ? 'border-red-200 bg-red-50'
                                : isExpiringSoon
                                  ? 'border-amber-200 bg-amber-50'
                                  : 'border-border bg-muted hover:bg-muted'
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-foreground">{cert.code}</p>
                                <p className="text-sm text-muted-foreground mt-0.5">{cert.name}</p>
                                {cert.issuer && (
                                  <p className="text-xs text-muted-foreground mt-1">{cert.issuer}</p>
                                )}
                              </div>
                              {cert.document_verified && (
                                <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                              )}
                            </div>

                            <div className="mt-3 pt-3 border-t border-border/50">
                              {cert.expiry_date ? (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Utløper</span>
                                  <span className={cn(
                                    'font-medium',
                                    isExpired ? 'text-red-600' :
                                    isExpiringSoon ? 'text-amber-600' : 'text-foreground'
                                  )}>
                                    {format(new Date(cert.expiry_date), 'd. MMM yyyy', { locale: nb })}
                                  </span>
                                </div>
                              ) : cert.is_permanent ? (
                                <Badge className="bg-emerald-100 text-emerald-700">Permanent</Badge>
                              ) : null}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">Ingen sertifikater registrert</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-6">
                <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-semibold text-foreground">Dokumenter</h3>
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
                    >
                      {uploadCv.isPending ? (
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-1.5" />
                      )}
                      Last opp
                    </Button>
                  </div>

                  {/* CV Card */}
                  <div className={cn(
                    'p-4 rounded-lg border-2 border-dashed transition-colors',
                    hasCv ? 'border-border bg-muted' : 'border-slate-300 bg-muted/50'
                  )}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'p-2.5 rounded-lg',
                          hasCv ? 'bg-blue-100' : 'bg-muted'
                        )}>
                          <FileText className={cn(
                            'h-5 w-5',
                            hasCv ? 'text-blue-600' : 'text-muted-foreground'
                          )} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">CV</p>
                          <p className="text-sm text-muted-foreground">
                            {hasCv ? 'PDF/Word dokument' : 'Ikke lastet opp'}
                          </p>
                        </div>
                      </div>
                      {hasCv && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadCv}
                          disabled={isDownloadingCv}
                        >
                          {isDownloadingCv ? (
                            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                          ) : (
                            <ExternalLink className="h-4 w-4 mr-1.5" />
                          )}
                          Åpne
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Other Documents */}
                  {candidate.documents && candidate.documents.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {candidate.documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted transition-colors">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">{doc.type}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6">
                <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                  <h3 className="text-base font-semibold text-foreground mb-6">Aktivitetslogg</h3>

                  <div className="relative">
                    <div className="absolute left-2 top-2 bottom-2 w-px bg-muted" />

                    <div className="space-y-6">
                      {raw?.created_at && (
                        <div className="relative flex gap-4 pl-8">
                          <div className="absolute left-0 top-0.5">
                            <div className="h-4 w-4 rounded-full bg-blue-500 ring-4 ring-white" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Profil opprettet</p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {format(new Date(raw.created_at), "d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}
                            </p>
                          </div>
                        </div>
                      )}

                      {raw?.updated_at && raw.updated_at !== raw.created_at && (
                        <div className="relative flex gap-4 pl-8">
                          <div className="absolute left-0 top-0.5">
                            <div className="h-4 w-4 rounded-full bg-muted-foreground ring-4 ring-white" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Profil oppdatert</p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {format(new Date(raw.updated_at), "d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}
                            </p>
                          </div>
                        </div>
                      )}

                      {raw?.compliance_checked_at && (
                        <div className="relative flex gap-4 pl-8">
                          <div className="absolute left-0 top-0.5">
                            <div className="h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-white" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Compliance sjekket</p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {format(new Date(raw.compliance_checked_at), "d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}
                            </p>
                          </div>
                        </div>
                      )}

                      {!raw?.created_at && (
                        <div className="text-center py-8">
                          <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                          <p className="text-muted-foreground">Ingen historikk tilgjengelig</p>
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
    </div>
  )
}

function CandidateProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="py-3 border-b border-border/50">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="py-6 flex items-start justify-between">
            <div className="flex items-center gap-5">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-8">
          <div className="space-y-6">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-12 w-full rounded-lg mb-6" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}
