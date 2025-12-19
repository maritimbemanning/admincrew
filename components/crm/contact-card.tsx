'use client'

import { User, Mail, Phone, Building2, MoreHorizontal, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

export interface Contact {
  id: string
  first_name: string
  last_name: string
  email?: string | null
  phone?: string | null
  title?: string | null
  is_primary?: boolean
  organization?: {
    id: string
    name: string
  } | null
}

interface ContactCardProps {
  contact: Contact
  onEdit?: (contact: Contact) => void
  onDelete?: (contact: Contact) => void
  showOrganization?: boolean
}

export function ContactCard({ 
  contact, 
  onEdit, 
  onDelete,
  showOrganization = true 
}: ContactCardProps) {
  const initials = `${contact.first_name[0]}${contact.last_name[0]}`.toUpperCase()
  const fullName = `${contact.first_name} ${contact.last_name}`

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link 
                  href={`/crm/contacts/${contact.id}`}
                  className="font-semibold hover:underline"
                >
                  {fullName}
                </Link>
                {contact.is_primary && (
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/crm/contacts/${contact.id}`}>
                      Vis detaljer
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit?.(contact)}>
                    Rediger
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onDelete?.(contact)}
                  >
                    Slett
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {contact.title && (
              <p className="text-sm text-muted-foreground">{contact.title}</p>
            )}

            {showOrganization && contact.organization && (
              <div className="flex items-center gap-1 mt-1">
                <Building2 className="h-3 w-3 text-muted-foreground" />
                <Link 
                  href={`/crm/organizations/${contact.organization.id}`}
                  className="text-sm text-muted-foreground hover:underline"
                >
                  {contact.organization.name}
                </Link>
              </div>
            )}

            <div className="flex flex-wrap gap-3 mt-3 text-sm">
              {contact.email && (
                <a 
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Mail className="h-4 w-4" />
                  <span className="truncate max-w-[200px]">{contact.email}</span>
                </a>
              )}
              {contact.phone && (
                <a 
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Phone className="h-4 w-4" />
                  <span>{contact.phone}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
