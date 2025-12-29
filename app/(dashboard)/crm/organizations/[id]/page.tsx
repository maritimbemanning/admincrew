'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { notFound } from 'next/navigation'
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  MapPin,
  Plus,
  MoreHorizontal,
  Users,
  FileText,
  Briefcase,
  DollarSign,
  Loader2,
  Edit
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useOrganization, useOrganizationContacts, pipelineStages, industries } from '@/hooks/use-organizations'
import { cn } from '@/lib/utils'

const customerTypeColors: Record<string, string> = {
  prospect: 'bg-yellow-100 text-yellow-800',
  customer: 'bg-green-100 text-green-800',
  partner: 'bg-blue-100 text-blue-800',
  churned: 'bg-gray-100 text-gray-800',
}

const customerTypeLabels: Record<string, string> = {
  prospect: 'Prospekt',
  customer: 'Kunde',
  partner: 'Partner',
  churned: 'Tapt',
}

export default function OrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  
  const { data: org, isLoading, error } = useOrganization(id)
  const { data: contacts } = useOrganizationContacts(id)

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-'
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return <OrganizationPageSkeleton />
  }

  if (error || !org) {
    notFound()
  }

  const stageInfo = pipelineStages.find(s => s.value === org.pipeline_stage)
  const industryInfo = industries.find(i => i.value === org.industry)
  const stats = (org.stats as Record<string, number>) || {}

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/crm/organizations')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {org.logo_url ? (
              <img
                src={org.logo_url}
                alt={org.name}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{org.name}</h1>
              <p className="text-muted-foreground">
                {org.org_number ? `Org.nr: ${org.org_number}` : 'Ingen org.nr'}
                {org.address_city && ` • ${org.address_city}`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {org.customer_type && (
            <Badge className={customerTypeColors[org.customer_type] || ''}>
              {customerTypeLabels[org.customer_type] || org.customer_type}
            </Badge>
          )}
          {stageInfo && (
            <Badge className={cn(stageInfo.bgColor, stageInfo.color)}>
              {stageInfo.label}
            </Badge>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MoreHorizontal className="mr-2 h-4 w-4" />
              Handlinger
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/crm/organizations/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Rediger organisasjon
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/operations/requests/new?org=${id}`)}>
              <Plus className="mr-2 h-4 w-4" />
              Ny forespørsel
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Phone className="mr-2 h-4 w-4" />
              Logg samtale
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Mail className="mr-2 h-4 w-4" />
              Send e-post
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Arkiver</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Contact Info Bar */}
      <div className="flex flex-wrap items-center gap-6 text-sm">
        {org.email && (
          <a href={`mailto:${org.email}`} className="flex items-center gap-2 hover:text-primary">
            <Mail className="h-4 w-4" />
            {org.email}
          </a>
        )}
        {org.phone && (
          <a href={`tel:${org.phone}`} className="flex items-center gap-2 hover:text-primary">
            <Phone className="h-4 w-4" />
            {org.phone}
          </a>
        )}
        {org.website && (
          <a href={org.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary">
            <Globe className="h-4 w-4" />
            {org.website}
          </a>
        )}
        {org.address_street && (
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {org.address_street}, {org.address_postal_code} {org.address_city}
          </span>
        )}
        {industryInfo && (
          <Badge variant="secondary">{industryInfo.label}</Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktive oppdrag</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_assignments || 0}</div>
            <p className="text-xs text-muted-foreground">
              av {stats.total_assignments || 0} totalt
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Åpne requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.open_requests || 0}</div>
            <p className="text-xs text-muted-foreground">
              av {stats.total_requests || 0} totalt
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Estimert årlig</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(org.estimated_annual_value_nok)}
            </div>
            <p className="text-xs text-muted-foreground">
              per år
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lifetime value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(org.lifetime_value_nok)}
            </div>
            <p className="text-xs text-muted-foreground">
              totalt omsatt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Oversikt</TabsTrigger>
          <TabsTrigger value="contacts">Kontakter</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="assignments">Oppdrag</TabsTrigger>
          <TabsTrigger value="activity">Aktivitet</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Contacts Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Kontaktpersoner</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => router.push(`/crm/contacts/new?org=${id}`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Legg til
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {contacts && contacts.length > 0 ? (
                  contacts.map((contact: Record<string, unknown>) => (
                    <div 
                      key={contact.id as string} 
                      className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/crm/contacts/${contact.id}`)}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {contact.first_name as string} {contact.last_name as string}
                          </span>
                          {(contact.is_primary as boolean) && (
                            <Badge variant="secondary" className="text-xs">Primær</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{contact.position as string || contact.job_title as string}</p>
                        <div className="flex gap-4 mt-1 text-sm">
                          {(contact.email as string) && (
                            <span className="text-muted-foreground">{contact.email as string}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Ingen kontakter lagt til</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => router.push(`/crm/contacts/new?org=${id}`)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Legg til kontakt
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions & Notes */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Hurtighandlinger</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => router.push(`/operations/requests/new?org=${id}`)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ny forespørsel
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Phone className="mr-2 h-4 w-4" />
                    Logg samtale
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Mail className="mr-2 h-4 w-4" />
                    Send e-post
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <FileText className="mr-2 h-4 w-4" />
                    Legg til notat
                  </Button>
                </CardContent>
              </Card>

              {org.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Notater</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{org.notes}</p>
                  </CardContent>
                </Card>
              )}

              {org.tags && org.tags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tags</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {org.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Kontakter</CardTitle>
              <Button onClick={() => router.push(`/crm/contacts/new?org=${id}`)}>
                <Plus className="mr-2 h-4 w-4" />
                Ny kontakt
              </Button>
            </CardHeader>
            <CardContent>
              {contacts && contacts.length > 0 ? (
                <div className="space-y-2">
                  {contacts.map((contact: Record<string, unknown>) => (
                    <div 
                      key={contact.id as string}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                      onClick={() => router.push(`/crm/contacts/${contact.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{contact.first_name as string} {contact.last_name as string}</p>
                          <p className="text-sm text-muted-foreground">{contact.position as string || contact.job_title as string}</p>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {contact.email as string}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Ingen kontakter registrert</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Forespørsler</CardTitle>
              <Button onClick={() => router.push(`/operations/requests/new?org=${id}`)}>
                <Plus className="mr-2 h-4 w-4" />
                Ny forespørsel
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Forespørsler for denne organisasjonen vil vises her.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>Oppdrag</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Oppdrag for denne organisasjonen vil vises her.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Aktivitetslogg</CardTitle>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Logg aktivitet
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Aktivitetslogg vil vises her.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function OrganizationPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
      </div>
      <div className="flex gap-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
