'use client'

import * as React from 'react'
import { Check, Circle, AlertCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'

export interface ChecklistItem {
  id: string
  label: string
  description?: string
  completed: boolean
  completed_at?: string | null
  completed_by?: string | null
  required: boolean
  order: number
  category?: string
}

interface ReleaseChecklistProps {
  items: ChecklistItem[]
  onToggle: (itemId: string, completed: boolean) => void
  isLoading?: boolean
  className?: string
}

// Default checklist template for new assignments
export const defaultReleaseChecklistItems: Omit<ChecklistItem, 'id' | 'completed' | 'completed_at' | 'completed_by'>[] = [
  // Pre-release
  { label: 'Kandidat godkjent', description: 'Kandidat valgt og bekreftet', required: true, order: 1, category: 'pre-release' },
  { label: 'Compliance verifisert', description: 'Dokumenter og sertifiseringer godkjent', required: true, order: 2, category: 'pre-release' },
  { label: 'Referanser sjekket', description: 'Minimum to referanser kontaktet', required: false, order: 3, category: 'pre-release' },
  
  // Contract
  { label: 'Kontrakt generert', description: 'Oppdragskontrakt opprettet fra mal', required: true, order: 4, category: 'contract' },
  { label: 'Kontrakt godkjent internt', description: 'Godkjent av ansvarlig', required: true, order: 5, category: 'contract' },
  { label: 'Kontrakt sendt til signering', description: 'Alle parter mottatt', required: true, order: 6, category: 'contract' },
  { label: 'Kontrakt signert', description: 'Alle parter har signert', required: true, order: 7, category: 'contract' },
  
  // Onboarding
  { label: 'Velkomstpakke sendt', description: 'Informasjon om oppdrag sendt til konsulent', required: true, order: 8, category: 'onboarding' },
  { label: 'Tilgang opprettet', description: 'Nødvendige tilganger satt opp', required: false, order: 9, category: 'onboarding' },
  { label: 'Oppstartsmøte gjennomført', description: 'Kick-off med kunde og konsulent', required: false, order: 10, category: 'onboarding' },
  
  // Ready
  { label: 'Klar for start', description: 'Alt er klart for oppstart', required: true, order: 11, category: 'ready' },
]

const categoryLabels: Record<string, string> = {
  'pre-release': 'Før utgivelse',
  'contract': 'Kontrakt',
  'onboarding': 'Onboarding',
  'ready': 'Klar for start',
}

export function ReleaseChecklist({ 
  items, 
  onToggle, 
  isLoading,
  className 
}: ReleaseChecklistProps) {
  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {} as Record<string, ChecklistItem[]>)

  // Calculate progress
  const completedCount = items.filter((i) => i.completed).length
  const totalCount = items.length
  const requiredCount = items.filter((i) => i.required).length
  const completedRequiredCount = items.filter((i) => i.required && i.completed).length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
  const requiredComplete = completedRequiredCount === requiredCount

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Release Checklist</span>
          <span className="text-sm font-normal text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </CardTitle>
        <div className="space-y-2">
          <Progress value={progress} />
          <div className="flex items-center gap-2 text-sm">
            {requiredComplete ? (
              <span className="flex items-center gap-1 text-green-600">
                <Check className="h-4 w-4" />
                Alle påkrevde steg fullført
              </span>
            ) : (
              <span className="flex items-center gap-1 text-yellow-600">
                <AlertCircle className="h-4 w-4" />
                {requiredCount - completedRequiredCount} påkrevde steg gjenstår
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedItems).map(([category, categoryItems]) => (
          <div key={category}>
            <h4 className="font-medium text-sm text-muted-foreground mb-3">
              {categoryLabels[category] || category}
            </h4>
            <div className="space-y-3">
              {categoryItems
                .sort((a, b) => a.order - b.order)
                .map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                      item.completed && 'bg-muted/50'
                    )}
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={(checked) => onToggle(item.id, !!checked)}
                      disabled={isLoading}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          'font-medium',
                          item.completed && 'line-through text-muted-foreground'
                        )}>
                          {item.label}
                        </p>
                        {item.required && !item.completed && (
                          <span className="text-xs text-red-500">*</span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                      {item.completed_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Fullført {new Date(item.completed_at).toLocaleDateString('nb-NO')}
                          {item.completed_by && ` av ${item.completed_by}`}
                        </p>
                      )}
                    </div>
                    {item.completed ? (
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
