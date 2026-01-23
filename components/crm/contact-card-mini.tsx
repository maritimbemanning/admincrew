'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Building2, Phone, Mail, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { CrmContact, CrmPriority } from '@/types/crm'
import { CRM_PRIORITY_COLORS } from '@/types/crm'

interface ContactCardMiniProps {
  contact: CrmContact
  onClick?: () => void
  isDragging?: boolean
}

function formatCurrency(value: number | null): string {
  if (!value) return ''
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`
  }
  return value.toString()
}

function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return `${Math.abs(diffDays)}d siden`
  }
  if (diffDays === 0) {
    return 'I dag'
  }
  if (diffDays === 1) {
    return 'I morgen'
  }
  return `om ${diffDays}d`
}

// Check if contact is stale (no activity in 30+ days)
function isStale(contact: CrmContact): boolean {
  if (!contact.last_contacted) return false
  const lastContact = new Date(contact.last_contacted)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays >= 30
}

export function ContactCardMini({ contact, onClick, isDragging }: ContactCardMiniProps) {
  const stale = isStale(contact)

  return (
    <div
      className={cn(
        'bg-card rounded-lg p-3 cursor-pointer transition-all card-tactical',
        'dark:bg-navy-800/50',
        isDragging && 'shadow-lg ring-2 ring-gold-500/30 rotate-2',
        stale && 'frost-effect'
      )}
      onClick={onClick}
    >
      {/* Header: Name + Priority */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-sm line-clamp-1">{contact.name}</h4>
        {contact.priority && contact.priority !== 'normal' && (
          <Badge
            className={cn(
              'text-[10px] px-1.5 py-0',
              CRM_PRIORITY_COLORS[contact.priority]
            )}
          >
            {contact.priority === 'high' ? 'Høy' : 'Lav'}
          </Badge>
        )}
      </div>

      {/* Company */}
      {contact.company && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
          <Building2 className="h-3 w-3 shrink-0" />
          <span className="truncate">{contact.company}</span>
        </div>
      )}

      {/* Deal Value + Probability Gauge */}
      {(contact.deal_value || contact.probability) && (
        <div className="flex items-center justify-between gap-2 mb-2 pt-2 border-t border-white/5">
          {contact.deal_value && (
            <span className="font-mono text-sm font-semibold text-gold-400">
              {formatCurrency(contact.deal_value)} kr
            </span>
          )}
          {contact.probability && (
            <div className="flex items-center gap-1.5">
              <div className="match-score-bar w-12">
                <div
                  className="match-score-fill"
                  style={{ width: `${contact.probability}%` }}
                />
              </div>
              <span className="text-tactical text-gold-400 w-8 text-right">
                {contact.probability}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Follow-up date + Stale indicator */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {contact.follow_up_date && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 shrink-0" />
            <span
              className={cn(
                new Date(contact.follow_up_date) < new Date() && 'text-red-500 font-medium'
              )}
            >
              {formatDate(contact.follow_up_date)}
            </span>
          </div>
        )}
        {stale && (
          <span className="text-tactical text-blue-400">STALE</span>
        )}
      </div>

      {/* Tags */}
      {contact.tags && contact.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {contact.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
          {contact.tags.length > 2 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              +{contact.tags.length - 2}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

// Sortable/Draggable version
export function SortableContactCard({ contact, onClick }: ContactCardMiniProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contact.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isDragging && 'z-50'
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center',
          'opacity-0 group-hover:opacity-100 transition-opacity cursor-grab',
          'text-muted-foreground hover:text-foreground',
          isDragging && 'cursor-grabbing'
        )}
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div className={cn(isDragging ? 'opacity-50' : '', 'pl-2')}>
        <ContactCardMini
          contact={contact}
          onClick={onClick}
          isDragging={isDragging}
        />
      </div>
    </div>
  )
}
