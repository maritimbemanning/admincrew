'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
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
  DollarSign
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Mock data - will be replaced with real data fetching
const mockOrganization = {
  id: '1',
  name: 'Frøy AS',
  org_number: '912345678',
  industry: 'aquaculture',
  customer_type: 'customer',
  pipeline_stage: 'won',
  website: 'https://froy.no',
  email: 'post@froy.no',
  phone: '+47 73 00 00 00',
  address_street: 'Havnegata 1',
  address_postal_code: '7010',
  address_city: 'Trondheim',
  notes: 'God kunde siden 2022. Foretrekker erfarne kapteiner med wellboat-erfaring.',
  tags: ['havbruk', 'wellboat', 'enterprise', 'god betaler', 'høy prioritet'],
  stats: {
    total_requests: 15,
    open_requests: 2,
    total_assignments: 12,
    active_assignments: 3,
    total_contracts: 10,
    total_invoices: 8,
    total_revenue_nok: 2456000,
    outstanding_amount_nok: 156000,
  },
  contacts: [
    {
      id: '1',
      first_name: 'Per',
      last_name: 'Hansen',
      job_title: 'HR-sjef',
      email: 'per@froy.no',
      phone: '+47 900 00 001',
      is_primary: true,
      is_decision_maker: true,
    },
    {
      id: '2',
      first_name: 'Kari',
      last_name: 'Olsen',
      job_title: 'Driftsleder',
      email: 'kari@froy.no',
      phone: '+47 900 00 002',
      is_primary: false,
      is_operational_contact: true,
    },
  ],
  requests: [
    {
      id: '1',
      request_number: 'REQ-2024-0089',
      title: '2x Kaptein til MS Frøy Viking',
      status: 'matching',
      start_date: '2025-01-15',
      estimated_value_nok: 180000,
    },
    {
      id: '2',
      request_number: 'REQ-2024-0092',
      title: '1x Maskinist til MS Frøy Australis',
      status: 'shortlisted',
      start_date: '2025-02-01',
      estimated_value_nok: 95000,
    },
  ],
  assignments: [
    {
      id: '1',
      assignment_number: 'ASN-2024-0045',
      candidate_name: 'Ole Hansen',
      role: 'Kaptein',
      vessel: 'MS Frøy Viking',
      status: 'active',
      period: 'Sep-Des 2024',
    },
    {
      id: '2',
      assignment_number: 'ASN-2024-0046',
      candidate_name: 'Kari Nordmann',
      role: 'Styrmann',
      vessel: 'MS Frøy Viking',
      status: 'active',
      period: 'Okt-Jan 2025',
    },
  ],
}

const statusColors: Record<string, string> = {
  matching: 'bg-yellow-100 text-yellow-800',
  shortlisted: 'bg-green-100 text-green-800',
  active: 'bg-blue-100 text-blue-800',
}

const statusLabels: Record<string, string> = {
  matching: 'Matching',
  shortlisted: 'Shortlistet',
  active: 'Aktiv',
}

export default function OrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const org = mockOrganization // Will use real data hook

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      maximumFractionDigits: 0,
    }).format(amount)
  }

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
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{org.name}</h1>
              <p className="text-muted-foreground">
                Org.nr: {org.org_number} • {org.address_city}
              </p>
            </div>
          </div>
        </div>
        <Badge className="bg-green-100 text-green-800">Kunde</Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MoreHorizontal className="mr-2 h-4 w-4" />
              Handlinger
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Rediger organisasjon</DropdownMenuItem>
            <DropdownMenuItem>Ny request</DropdownMenuItem>
            <DropdownMenuItem>Logg samtale</DropdownMenuItem>
            <DropdownMenuItem>Send e-post</DropdownMenuItem>
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
        <span className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {org.address_street}, {org.address_postal_code} {org.address_city}
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Aktive oppdrag</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{org.stats.active_assignments}</div>
            <p className="text-xs text-muted-foreground">
              av {org.stats.total_assignments} totalt
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Åpne requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{org.stats.open_requests}</div>
            <p className="text-xs text-muted-foreground">
              av {org.stats.total_requests} totalt
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
              {formatCurrency(org.stats.total_revenue_nok)}
            </div>
            <p className="text-xs text-muted-foreground">
              totalt omsatt
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Utestående</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(org.stats.outstanding_amount_nok)}
            </div>
            <p className="text-xs text-muted-foreground">
              {org.stats.total_invoices} fakturaer
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
          <TabsTrigger value="contracts">Kontrakter</TabsTrigger>
          <TabsTrigger value="invoices">Fakturaer</TabsTrigger>
          <TabsTrigger value="activity">Aktivitet</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Contacts Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Kontaktpersoner</CardTitle>
                <Button variant="ghost" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Legg til
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {org.contacts.map((contact) => (
                  <div key={contact.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {contact.first_name} {contact.last_name}
                        </span>
                        {contact.is_primary && (
                          <Badge variant="secondary" className="text-xs">Primær</Badge>
                        )}
                        {contact.is_decision_maker && (
                          <Badge variant="secondary" className="text-xs">Beslutningstaker</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{contact.job_title}</p>
                      <div className="flex gap-4 mt-1 text-sm">
                        <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                          {contact.email}
                        </a>
                        <a href={`tel:${contact.phone}`} className="text-muted-foreground hover:text-primary">
                          {contact.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions & Notes */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Hurtighandlinger</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="justify-start">
                    <Plus className="mr-2 h-4 w-4" />
                    Ny request
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

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notater</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{org.notes}</p>
                </CardContent>
              </Card>

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
                  <Button variant="ghost" size="sm" className="h-6 px-2">
                    <Plus className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Active Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Aktive requests</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/operations/requests')}>
                Se alle →
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {org.requests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/operations/requests/${request.id}`)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{request.request_number}</span>
                      <Badge className={statusColors[request.status]}>
                        {statusLabels[request.status]}
                      </Badge>
                    </div>
                    <p className="text-sm">{request.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Start: {request.start_date} • Verdi: ~{formatCurrency(request.estimated_value_nok)}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    {request.status === 'matching' ? 'Match →' : 'Se →'}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Active Assignments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Aktive oppdrag</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/operations/assignments')}>
                Se alle →
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {org.assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/operations/assignments/${assignment.id}`)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{assignment.assignment_number}</span>
                      <Badge className={statusColors[assignment.status]}>
                        {statusLabels[assignment.status]}
                      </Badge>
                    </div>
                    <p className="text-sm">
                      {assignment.candidate_name} - {assignment.role}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {assignment.vessel} • {assignment.period}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Detaljer
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Kontakter</CardTitle>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Ny kontakt
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Kontaktliste kommer her...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Requests</CardTitle>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Ny request
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Request-liste kommer her...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>Oppdrag</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Oppdragsliste kommer her...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts">
          <Card>
            <CardHeader>
              <CardTitle>Kontrakter</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Kontraktliste kommer her...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Fakturaer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Fakturaliste kommer her...</p>
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
              <p className="text-muted-foreground">Aktivitetslogg kommer her...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
