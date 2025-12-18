'use client'

import { use } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { useCandidate, useUpdateCandidateRating, useUpdateCandidateTags } from '@/hooks'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  Star,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Shield,
  Briefcase,
  Clock,
  MoreHorizontal,
  Edit,
  Target,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AvailabilityStatus, ComplianceStatus } from '@/types'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

interface PageProps {
  params: Promise<{ id: string }>
}

const availabilityConfig: Record<AvailabilityStatus, { label: string; color: string; bgColor: string }> = {
  available: { label: 'Tilgjengelig', color: 'text-green-700', bgColor: 'bg-green-100' },
  available_soon: { label: 'Snart tilgjengelig', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  on_assignment: { label: 'Pa oppdrag', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  unavailable: { label: 'Utilgjengelig', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  inactive: { label: 'Inaktiv', color: 'text-gray-500', bgColor: 'bg-gray-50' },
}

const complianceConfig: Record<ComplianceStatus, { label: string; icon: typeof CheckCircle; color: string }> = {
  not_started: { label: 'Ikke startet', icon: Clock, color: 'text-gray-500' },
  documents_pending: { label: 'Dokumenter mangler', icon: AlertCircle, color: 'text-yellow-600' },
  review_pending: { label: 'Under vurdering', icon: Clock, color: 'text-blue-600' },
  approved: { label: 'Godkjent', icon: CheckCircle, color: 'text-green-600' },
  expired: { label: 'Utlopt', icon: XCircle, color: 'text-red-600' },
  rejected: { label: 'Avvist', icon: XCircle, color: 'text-red-600' },
}

export default function CandidateProfilePage({ params }: PageProps) {
  const { id } = use(params)
  const { data: candidate, isLoading, error } = useCandidate(id)

  if (isLoading) {
    return <CandidateProfileSkeleton />
  }

  if (error || !candidate) {
    notFound()
  }

  const availability = availabilityConfig[candidate.availability_status]
  const compliance = complianceConfig[candidate.compliance_status]
  const ComplianceIcon = compliance.icon
  const initials = `${candidate.first_name[0]}${candidate.last_name[0]}`

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-auto">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/candidates">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbake til kandidater
              </Link>
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Target className="h-4 w-4 mr-2" />
                Match til request
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/candidates/${id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Rediger
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Last ned CV
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Star className="h-4 w-4 mr-2" />
                    Legg til i favoritter
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Arkiver kandidat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Profile Header */}
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={candidate.avatar_url || undefined} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">
                  {candidate.first_name} {candidate.last_name}
                </h1>
                {candidate.internal_rating && (
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="font-semibold">{candidate.internal_rating}</span>
                  </div>
                )}
                <Badge className={cn(availability.bgColor, availability.color, 'border-0')}>
                  {availability.label}
                </Badge>
              </div>

              <div className="text-lg text-muted-foreground mb-3">
                {candidate.primary_role}
                {candidate.secondary_roles.length > 0 && (
                  <span> / {candidate.secondary_roles.join(', ')}</span>
                )}
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4" />
                  {candidate.experience_years} ars erfaring
                </div>
                {candidate.fylke && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {candidate.fylke}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  {candidate.email}
                </div>
                {candidate.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4" />
                    {candidate.phone}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="col-span-2 space-y-6">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Oversikt</TabsTrigger>
                <TabsTrigger value="certifications">Sertifikater</TabsTrigger>
                <TabsTrigger value="documents">Dokumenter</TabsTrigger>
                <TabsTrigger value="history">Historikk</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* Certifications Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sertifikater</CardTitle>
                    <CardDescription>
                      {candidate.certifications?.length || 0} aktive sertifikater
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {candidate.certifications && candidate.certifications.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {candidate.certifications.slice(0, 6).map((cert) => {
                          const isExpiringSoon = cert.expiry_date &&
                            new Date(cert.expiry_date) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                          const isExpired = cert.expiry_date && new Date(cert.expiry_date) < new Date()

                          return (
                            <div
                              key={cert.id}
                              className={cn(
                                'flex items-center justify-between p-3 rounded-lg border',
                                isExpired && 'border-red-200 bg-red-50',
                                isExpiringSoon && !isExpired && 'border-yellow-200 bg-yellow-50'
                              )}
                            >
                              <div>
                                <div className="font-medium">{cert.code}</div>
                                <div className="text-sm text-muted-foreground">{cert.name}</div>
                              </div>
                              {cert.expiry_date && (
                                <div className={cn(
                                  'text-sm',
                                  isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-muted-foreground'
                                )}>
                                  {isExpired ? 'Utlopt' : format(new Date(cert.expiry_date), 'dd.MM.yyyy')}
                                </div>
                              )}
                              {cert.is_permanent && (
                                <Badge variant="secondary">Permanent</Badge>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Ingen sertifikater registrert
                      </div>
                    )}
                    {candidate.certifications && candidate.certifications.length > 6 && (
                      <Button variant="link" className="mt-4 px-0">
                        Se alle {candidate.certifications.length} sertifikater
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* CV Summary */}
                {candidate.cv_summary && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">CV Sammendrag</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {candidate.cv_summary}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Experience Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Erfaring</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Total erfaring</div>
                          <div className="font-medium">{candidate.experience_years} ar</div>
                        </div>
                        {candidate.sectors && candidate.sectors.length > 0 && (
                          <div>
                            <div className="text-sm text-muted-foreground">Sektorer</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {candidate.sectors.map((sector) => (
                                <Badge key={sector} variant="secondary">{sector}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="certifications" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Alle sertifikater</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {candidate.certifications && candidate.certifications.length > 0 ? (
                      <div className="space-y-3">
                        {candidate.certifications.map((cert) => (
                          <div key={cert.id} className="flex items-center justify-between p-4 rounded-lg border">
                            <div className="flex-1">
                              <div className="font-medium">{cert.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {cert.code} {cert.issuer && `- ${cert.issuer}`}
                              </div>
                            </div>
                            <div className="text-right">
                              {cert.expiry_date ? (
                                <div className="text-sm">
                                  Utloper: {format(new Date(cert.expiry_date), 'dd.MM.yyyy')}
                                </div>
                              ) : cert.is_permanent ? (
                                <Badge variant="secondary">Permanent</Badge>
                              ) : null}
                              {cert.document_verified && (
                                <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Verifisert
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Ingen sertifikater registrert
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dokumenter</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {candidate.documents && candidate.documents.length > 0 ? (
                      <div className="space-y-3">
                        {candidate.documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                              <div>
                                <div className="font-medium">{doc.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {doc.type} - Lastet opp {format(new Date(doc.uploaded_at), 'dd.MM.yyyy')}
                                </div>
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Last ned
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Ingen dokumenter lastet opp
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Oppdragshistorikk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      Ingen tidligere oppdrag registrert
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Handlinger</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  Ring {candidate.phone || 'Ingen telefon'}
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Send e-post
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Se CV
                </Button>
              </CardContent>
            </Card>

            {/* Compliance Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn('flex items-center gap-2 p-3 rounded-lg', compliance.color)}>
                  <ComplianceIcon className="h-5 w-5" />
                  <span className="font-medium">{compliance.label}</span>
                </div>
                {candidate.compliance_checked_at && (
                  <div className="text-sm text-muted-foreground mt-2">
                    Sist sjekket: {format(new Date(candidate.compliance_checked_at), 'dd.MM.yyyy')}
                  </div>
                )}
                {candidate.compliance_expires_at && (
                  <div className="text-sm text-muted-foreground">
                    Utloper: {format(new Date(candidate.compliance_expires_at), 'dd.MM.yyyy')}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Availability */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tilgjengelighet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn('inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium', availability.bgColor, availability.color)}>
                  {availability.label}
                </div>
                {candidate.availability_date && (
                  <div className="text-sm text-muted-foreground mt-2">
                    Fra: {format(new Date(candidate.availability_date), 'dd.MM.yyyy')}
                  </div>
                )}
                {candidate.availability_notes && (
                  <div className="text-sm text-muted-foreground mt-2">
                    {candidate.availability_notes}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                {candidate.tags && candidate.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {candidate.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Ingen tags</div>
                )}
              </CardContent>
            </Card>

            {/* Pools */}
            {candidate.pools && candidate.pools.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pools</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {candidate.pools.map((pool) => (
                      <div
                        key={pool.id}
                        className="flex items-center gap-2 p-2 rounded-lg border"
                      >
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: pool.color }}
                        />
                        <span className="text-sm">{pool.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Internal Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interne notater</CardTitle>
              </CardHeader>
              <CardContent>
                {candidate.internal_notes ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {candidate.internal_notes}
                  </p>
                ) : (
                  <div className="text-sm text-muted-foreground">Ingen notater</div>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Info</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Opprettet</span>
                  <span>{format(new Date(candidate.created_at), 'dd.MM.yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sist oppdatert</span>
                  <span>{format(new Date(candidate.updated_at), 'dd.MM.yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kilde</span>
                  <span>{candidate.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profil fullfort</span>
                  <span>{candidate.profile_completeness}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function CandidateProfileSkeleton() {
  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-auto">
      <div className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-start gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
