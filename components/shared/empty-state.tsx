'use client'

import React from 'react'
import {
  Users,
  Building2,
  FileText,
  ClipboardList,
  Briefcase,
  Clock,
  Shield,
  Search,
  Plus,
  FolderOpen,
  Inbox,
  Filter,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type EmptyStateVariant =
  | 'default'
  | 'search'
  | 'filter'
  | 'candidates'
  | 'contacts'
  | 'requests'
  | 'assignments'
  | 'contracts'
  | 'timesheets'
  | 'documents'

interface EmptyStateProps {
  variant?: EmptyStateVariant
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  secondaryAction?: {
    label: string
    onClick?: () => void
    href?: string
  }
  className?: string
}

const VARIANT_CONFIGS: Record<EmptyStateVariant, {
  icon: React.ReactNode
  title: string
  description: string
}> = {
  default: {
    icon: <Inbox className="h-12 w-12" />,
    title: 'Ingen data',
    description: 'Det er ingen data å vise her ennå.',
  },
  search: {
    icon: <Search className="h-12 w-12" />,
    title: 'Ingen resultater',
    description: 'Prøv å justere søkekriteriene eller fjern noen filtre.',
  },
  filter: {
    icon: <Filter className="h-12 w-12" />,
    title: 'Ingen treff',
    description: 'Ingen elementer matcher de valgte filtrene. Prøv å justere filtrene.',
  },
  candidates: {
    icon: <Users className="h-12 w-12" />,
    title: 'Ingen kandidater',
    description: 'Det er ingen kandidater i denne listen ennå.',
  },
  contacts: {
    icon: <Building2 className="h-12 w-12" />,
    title: 'Ingen kontakter',
    description: 'Legg til din første kontakt for å komme i gang.',
  },
  requests: {
    icon: <ClipboardList className="h-12 w-12" />,
    title: 'Ingen forespørsler',
    description: 'Det er ingen aktive forespørsler å vise.',
  },
  assignments: {
    icon: <Briefcase className="h-12 w-12" />,
    title: 'Ingen oppdrag',
    description: 'Det er ingen oppdrag å vise i denne perioden.',
  },
  contracts: {
    icon: <FileText className="h-12 w-12" />,
    title: 'Ingen kontrakter',
    description: 'Det er ingen kontrakter å vise.',
  },
  timesheets: {
    icon: <Clock className="h-12 w-12" />,
    title: 'Ingen timeregistreringer',
    description: 'Det er ingen timeregistreringer i denne perioden.',
  },
  documents: {
    icon: <FolderOpen className="h-12 w-12" />,
    title: 'Ingen dokumenter',
    description: 'Det er ingen dokumenter lastet opp ennå.',
  },
}

export function EmptyState({
  variant = 'default',
  title,
  description,
  icon,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const config = VARIANT_CONFIGS[variant]

  const displayIcon = icon || config.icon
  const displayTitle = title || config.title
  const displayDescription = description || config.description

  const ActionButton = action ? (
    action.href ? (
      <Button asChild>
        <a href={action.href}>
          <Plus className="mr-2 h-4 w-4" />
          {action.label}
        </a>
      </Button>
    ) : (
      <Button onClick={action.onClick}>
        <Plus className="mr-2 h-4 w-4" />
        {action.label}
      </Button>
    )
  ) : null

  const SecondaryButton = secondaryAction ? (
    secondaryAction.href ? (
      <Button variant="outline" asChild>
        <a href={secondaryAction.href}>{secondaryAction.label}</a>
      </Button>
    ) : (
      <Button variant="outline" onClick={secondaryAction.onClick}>
        {secondaryAction.label}
      </Button>
    )
  ) : null

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="rounded-full bg-muted p-4 mb-4 text-muted-foreground">
        {displayIcon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{displayTitle}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{displayDescription}</p>
      {(ActionButton || SecondaryButton) && (
        <div className="flex gap-2">
          {ActionButton}
          {SecondaryButton}
        </div>
      )}
    </div>
  )
}

// Compact inline empty state
interface InlineEmptyProps {
  message?: string
  icon?: React.ReactNode
  className?: string
}

export function InlineEmpty({
  message = 'Ingen data',
  icon,
  className,
}: InlineEmptyProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 py-8 text-muted-foreground',
        className
      )}
    >
      {icon || <Inbox className="h-4 w-4" />}
      <span className="text-sm">{message}</span>
    </div>
  )
}

// Empty table row
interface EmptyTableRowProps {
  colSpan: number
  message?: string
}

export function EmptyTableRow({ colSpan, message = 'Ingen data' }: EmptyTableRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="h-24 text-center">
        <InlineEmpty message={message} />
      </td>
    </tr>
  )
}

// Empty search results with suggestions
interface EmptySearchProps {
  query?: string
  suggestions?: string[]
  onClearSearch?: () => void
  className?: string
}

export function EmptySearch({
  query,
  suggestions,
  onClearSearch,
  className,
}: EmptySearchProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="rounded-full bg-muted p-4 mb-4 text-muted-foreground">
        <Search className="h-12 w-12" />
      </div>
      <h3 className="text-lg font-semibold mb-2">
        Ingen resultater {query && `for "${query}"`}
      </h3>
      <p className="text-muted-foreground max-w-sm mb-4">
        Vi fant ingen treff på søket ditt. Prøv med andre søkeord.
      </p>
      {suggestions && suggestions.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Prøv å søke etter:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((suggestion, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-muted rounded-md text-sm cursor-pointer hover:bg-muted/80"
              >
                {suggestion}
              </span>
            ))}
          </div>
        </div>
      )}
      {onClearSearch && (
        <Button variant="outline" onClick={onClearSearch}>
          Nullstill søk
        </Button>
      )}
    </div>
  )
}

// Empty list with call to action
interface EmptyListProps {
  title: string
  description: string
  actionLabel: string
  actionHref?: string
  onAction?: () => void
  icon?: React.ReactNode
  className?: string
}

export function EmptyList({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
  className,
}: EmptyListProps) {
  return (
    <EmptyState
      title={title}
      description={description}
      icon={icon}
      action={{
        label: actionLabel,
        href: actionHref,
        onClick: onAction,
      }}
      className={className}
    />
  )
}

// Coming soon placeholder
interface ComingSoonProps {
  feature?: string
  className?: string
}

export function ComingSoon({ feature, className }: ComingSoonProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="rounded-full bg-primary/10 p-4 mb-4 text-primary">
        <AlertCircle className="h-12 w-12" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Kommer snart</h3>
      <p className="text-muted-foreground max-w-sm">
        {feature
          ? `${feature} er under utvikling og vil være tilgjengelig snart.`
          : 'Denne funksjonen er under utvikling og vil være tilgjengelig snart.'}
      </p>
    </div>
  )
}
