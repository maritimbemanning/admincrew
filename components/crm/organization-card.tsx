'use client'

import { Building2, MapPin, Globe, Phone, Mail, MoreHorizontal } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/shared'
import Link from 'next/link'

export interface Organization {
  id: string
  name: string
  org_number?: string | null
  industry?: string | null
  website?: string | null
  city?: string | null
  phone?: string | null
  email?: string | null
  pipeline_stage: string
  estimated_value?: number | null
  tags?: string[]
}

interface OrganizationCardProps {
  organization: Organization
  onEdit?: (org: Organization) => void
  onDelete?: (org: Organization) => void
}

export function OrganizationCard({ organization, onEdit, onDelete }: OrganizationCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Link 
                href={`/crm/organizations/${organization.id}`}
                className="font-semibold hover:underline"
              >
                {organization.name}
              </Link>
              {organization.org_number && (
                <p className="text-sm text-muted-foreground">
                  Org.nr: {organization.org_number}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/crm/organizations/${organization.id}`}>
                  Vis detaljer
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(organization)}>
                Rediger
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(organization)}
              >
                Slett
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <StatusBadge status={organization.pipeline_stage} />
          {organization.industry && (
            <Badge variant="outline">{organization.industry}</Badge>
          )}
        </div>

        <div className="space-y-2 text-sm">
          {organization.city && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{organization.city}</span>
            </div>
          )}
          {organization.website && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-4 w-4" />
              <a 
                href={organization.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {organization.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {organization.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{organization.phone}</span>
            </div>
          )}
          {organization.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{organization.email}</span>
            </div>
          )}
        </div>

        {organization.estimated_value && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">Estimert verdi</p>
            <p className="font-semibold">
              {organization.estimated_value.toLocaleString('nb-NO')} kr
            </p>
          </div>
        )}

        {organization.tags && organization.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {organization.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
