'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  Linkedin,
  MapPin,
  Calendar,
  TrendingUp,
  MoreHorizontal,
  Pencil,
  Archive,
  Trash2,
  Plus,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useCrmContact } from '@/hooks/use-crm-contact'
import { useArchiveCrmContact, useDeleteCrmContact } from '@/hooks/use-crm-contacts'
import type { CrmActivity, CrmTask, CrmDeal } from '@/types/crm'
import {
  CRM_CONTACT_STATUS_LABELS,
  CRM_CONTACT_STATUS_COLORS,
  CRM_PRIORITY_LABELS,
  CRM_PRIORITY_COLORS,
  CRM_ACTIVITY_TYPE_ICONS,
  CRM_ACTIVITY_TYPE_LABELS,
  CRM_TASK_STATUS_LABELS,
  CRM_DEAL_STAGE_LABELS,
} from '@/types/crm'

interface PageProps {
  params: Promise<{ id: string }>
}

function formatCurrency(value: number | null): string {
  if (!value) return '-'
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateString: string | null, withTime = false): string {
  if (!dateString) return '-'
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime && { hour: '2-digit', minute: '2-digit' }),
  }
  return new Date(dateString).toLocaleDateString('nb-NO', options)
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'I dag'
  if (diffDays === 1) return 'I går'
  if (diffDays < 7) return `${diffDays} dager siden`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} uker siden`
  return formatDate(dateString)
}

export default function ContactProfilePage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { data: contact, isLoading, error } = useCrmContact(id)
  const archiveContact = useArchiveCrmContact()
  const deleteContact = useDeleteCrmContact()

  const handleArchive = async () => {
    if (!contact) return
    await archiveContact.mutateAsync({ id: contact.id })
    router.push('/crm/contacts')
  }

  const handleDelete = async () => {
    if (!contact) return
    if (!confirm('Er du sikker på at du vil slette denne kontakten?')) return
    await deleteContact.mutateAsync(contact.id)
    router.push('/crm/contacts')
  }

  if (isLoading) {
    return <ContactProfileSkeleton />
  }

  if (error || !contact) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-lg font-medium text-destructive">
            Kunne ikke laste kontakt
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {error?.message || 'Kontakten finnes ikke'}
          </p>
          <Button className="mt-4" onClick={() => router.push('/crm/contacts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til kontakter
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{contact.name}</h1>
                {contact.status && (
                  <Badge className={cn(CRM_CONTACT_STATUS_COLORS[contact.status])}>
                    {CRM_CONTACT_STATUS_LABELS[contact.status]}
                  </Badge>
                )}
                {contact.priority && contact.priority !== 'normal' && (
                  <Badge
                    variant="secondary"
                    className={cn(CRM_PRIORITY_COLORS[contact.priority])}
                  >
                    {CRM_PRIORITY_LABELS[contact.priority]}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                {contact.company && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {contact.company}
                  </span>
                )}
                {contact.position && <span>{contact.position}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push(`/crm/contacts/${id}/edit`)}>
              <Pencil className="h-4 w-4 mr-2" />
              Rediger
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="h-4 w-4 mr-2" />
                  Arkiver
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Slett
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Contact Info */}
          <div className="space-y-6">
            {/* Contact Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kontaktinformasjon</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contact.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-sm hover:underline"
                    >
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-sm hover:underline"
                    >
                      {contact.phone}
                    </a>
                  </div>
                )}
                {contact.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:underline"
                    >
                      {contact.website}
                    </a>
                  </div>
                )}
                {contact.linkedin_url && (
                  <div className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={contact.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm hover:underline"
                    >
                      LinkedIn
                    </a>
                  </div>
                )}
                {(contact.location || contact.address) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {contact.address || contact.location}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deal Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Salgsdata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Verdi</span>
                  <span className="font-medium">
                    {formatCurrency(contact.deal_value)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sannsynlighet</span>
                  <span className="font-medium">
                    {contact.probability ? `${contact.probability}%` : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Oppfolging</span>
                  <span
                    className={cn(
                      'font-medium',
                      contact.follow_up_date &&
                        new Date(contact.follow_up_date) < new Date() &&
                        'text-red-500'
                    )}
                  >
                    {formatDate(contact.follow_up_date)}
                  </span>
                </div>
                {contact.industry && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bransje</span>
                    <span className="font-medium capitalize">{contact.industry}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            {contact.tags && contact.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {contact.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {(contact.notes || contact.pinned_note) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notater</CardTitle>
                </CardHeader>
                <CardContent>
                  {contact.pinned_note && (
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-md p-3 mb-3">
                      <p className="text-sm whitespace-pre-wrap">{contact.pinned_note}</p>
                    </div>
                  )}
                  {contact.notes && (
                    <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                      {contact.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Activities, Tasks, Deals */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="activities">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="activities">
                    Aktiviteter ({contact.activities?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="tasks">
                    Oppgaver ({contact.tasks?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="deals">
                    Deals ({contact.deals?.length || 0})
                  </TabsTrigger>
                </TabsList>

                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Logg aktivitet
                </Button>
              </div>

              <TabsContent value="activities" className="mt-0">
                <ActivityList activities={contact.activities || []} />
              </TabsContent>

              <TabsContent value="tasks" className="mt-0">
                <TaskList tasks={contact.tasks || []} />
              </TabsContent>

              <TabsContent value="deals" className="mt-0">
                <DealList deals={contact.deals || []} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

function ActivityList({ activities }: { activities: CrmActivity[] }) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>Ingen aktiviteter registrert</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {activities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-muted/50">
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">
                  {CRM_ACTIVITY_TYPE_ICONS[activity.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">
                      {CRM_ACTIVITY_TYPE_LABELS[activity.type]}
                    </span>
                    {activity.subject && (
                      <>
                        <span className="text-muted-foreground">-</span>
                        <span className="text-sm">{activity.subject}</span>
                      </>
                    )}
                  </div>
                  {activity.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{formatRelativeDate(activity.date)}</span>
                    {activity.created_by_name && (
                      <span>av {activity.created_by_name}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function TaskList({ tasks }: { tasks: CrmTask[] }) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>Ingen oppgaver registrert</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {tasks.map((task) => (
            <div key={task.id} className="p-4 hover:bg-muted/50">
              <div className="flex items-start gap-3">
                {task.status === 'done' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'font-medium',
                        task.status === 'done' && 'line-through text-muted-foreground'
                      )}
                    >
                      {task.title}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {CRM_TASK_STATUS_LABELS[task.status || 'todo']}
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  {task.due_date && (
                    <div
                      className={cn(
                        'flex items-center gap-1 mt-2 text-xs',
                        new Date(task.due_date) < new Date() && task.status !== 'done'
                          ? 'text-red-500'
                          : 'text-muted-foreground'
                      )}
                    >
                      <Calendar className="h-3 w-3" />
                      <span>Frist: {formatDate(task.due_date)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function DealList({ deals }: { deals: CrmDeal[] }) {
  if (deals.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>Ingen deals registrert</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {deals.map((deal) => (
            <div key={deal.id} className="p-4 hover:bg-muted/50">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{deal.title}</span>
                    {deal.stage && (
                      <Badge variant="secondary" className="text-xs">
                        {CRM_DEAL_STAGE_LABELS[deal.stage]}
                      </Badge>
                    )}
                  </div>
                  {deal.notes && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {deal.notes}
                    </p>
                  )}
                  {deal.expected_close_date && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Forventet: {formatDate(deal.expected_close_date)}</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-medium text-green-600">
                    {formatCurrency(deal.value)}
                  </div>
                  {deal.probability && (
                    <div className="text-xs text-muted-foreground">
                      {deal.probability}% sannsynlighet
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ContactProfileSkeleton() {
  return (
    <div className="p-4 space-y-6">
      <div className="flex items-start gap-4">
        <Skeleton className="h-10 w-10 rounded" />
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Skeleton className="h-10 w-64 mb-4" />
          <Card>
            <CardContent className="p-4 space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
