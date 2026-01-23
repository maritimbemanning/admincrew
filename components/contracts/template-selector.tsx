'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  FileText,
  Search,
  Star,
  Clock,
  Check,
  Eye,
  Copy,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContractTemplate {
  id: string
  name: string
  description: string
  type: 'employment' | 'service' | 'nda' | 'framework' | 'assignment'
  category: string
  is_default: boolean
  last_used?: string
  usage_count: number
  preview_url?: string
}

interface TemplateSelectorProps {
  templates?: ContractTemplate[]
  selectedId?: string
  onSelect: (template: ContractTemplate) => void
  onPreview?: (template: ContractTemplate) => void
  className?: string
}

// Mock templates
const defaultTemplates: ContractTemplate[] = [
  {
    id: '1',
    name: 'Standard oppdragsavtale',
    description: 'Brukes for korttidsoppdrag med definert start og slutt.',
    type: 'assignment',
    category: 'Oppdrag',
    is_default: true,
    last_used: '2025-01-08',
    usage_count: 45,
  },
  {
    id: '2',
    name: 'Rammeavtale',
    description: 'Langsiktig avtale med gjentakende utleie av mannskap.',
    type: 'framework',
    category: 'Rammeavtaler',
    is_default: false,
    last_used: '2025-01-05',
    usage_count: 12,
  },
  {
    id: '3',
    name: 'Ansettelsesavtale',
    description: 'Standard arbeidsavtale for fast ansettelse.',
    type: 'employment',
    category: 'Ansettelse',
    is_default: false,
    last_used: '2025-01-02',
    usage_count: 28,
  },
  {
    id: '4',
    name: 'Taushetserklæring (NDA)',
    description: 'Konfidensialitetsavtale for sensitiv informasjon.',
    type: 'nda',
    category: 'Diverse',
    is_default: false,
    last_used: '2024-12-15',
    usage_count: 8,
  },
  {
    id: '5',
    name: 'Konsulentavtale',
    description: 'For innleie av konsulenter og spesialister.',
    type: 'service',
    category: 'Konsulent',
    is_default: false,
    usage_count: 15,
  },
]

const typeLabels: Record<string, { label: string; color: string }> = {
  employment: { label: 'Ansettelse', color: 'bg-blue-100 text-blue-800' },
  service: { label: 'Tjeneste', color: 'bg-purple-100 text-purple-800' },
  nda: { label: 'NDA', color: 'bg-gray-100 text-gray-800' },
  framework: { label: 'Rammeavtale', color: 'bg-green-100 text-green-800' },
  assignment: { label: 'Oppdrag', color: 'bg-orange-100 text-orange-800' },
}

export function TemplateSelector({
  templates = defaultTemplates,
  selectedId,
  onSelect,
  onPreview,
  className,
}: TemplateSelectorProps) {
  const [search, setSearch] = React.useState('')
  const [previewTemplate, setPreviewTemplate] = React.useState<ContractTemplate | null>(null)

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(search.toLowerCase()) ||
    template.description.toLowerCase().includes(search.toLowerCase()) ||
    template.category.toLowerCase().includes(search.toLowerCase())
  )

  // Group by category
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = []
    }
    acc[template.category].push(template)
    return acc
  }, {} as Record<string, ContractTemplate[]>)

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Søk etter mal..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Templates grid */}
      <div className="space-y-6">
        {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
          <div key={category}>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {category}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {categoryTemplates.map((template) => {
                const typeInfo = typeLabels[template.type]
                const isSelected = selectedId === template.id

                return (
                  <Card
                    key={template.id}
                    className={cn(
                      'cursor-pointer transition-all hover:shadow-md',
                      isSelected && 'ring-2 ring-primary'
                    )}
                    onClick={() => onSelect(template)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-sm font-medium">
                            {template.name}
                          </CardTitle>
                        </div>
                        {template.is_default && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      <CardDescription className="text-xs line-clamp-2">
                        {template.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="secondary" 
                          className={cn('text-xs', typeInfo.color)}
                        >
                          {typeInfo.label}
                        </Badge>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {template.last_used && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(template.last_used).toLocaleDateString('nb-NO', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          )}
                          <span>{template.usage_count} bruk</span>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreviewTemplate(template)
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Forhåndsvis
                        </Button>
                        {isSelected && (
                          <div className="ml-auto flex items-center gap-1 text-xs text-primary">
                            <Check className="h-3 w-3" />
                            Valgt
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Preview dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              {previewTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg p-6 max-h-[400px] overflow-y-auto bg-muted/30">
            <div className="prose prose-sm max-w-none">
              <h1>{previewTemplate?.name}</h1>
              <p>
                Denne avtalen inngås mellom [LEVERANDØR] og [OPPDRAGSGIVER].
              </p>
              <h2>1. Avtalens formål</h2>
              <p>
                Avtalen regulerer vilkårene for [beskrivelse av tjeneste/oppdrag].
              </p>
              <h2>2. Avtalens varighet</h2>
              <p>
                Avtalen gjelder fra [startdato] til [sluttdato].
              </p>
              <h2>3. Vederlag</h2>
              <p>
                Oppdragsgiver betaler [beløp] kr eks. mva.
              </p>
              <p className="text-muted-foreground italic">
                ... (mer innhold i fullversjonen)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Lukk
            </Button>
            <Button onClick={() => {
              if (previewTemplate) {
                onSelect(previewTemplate)
                setPreviewTemplate(null)
              }
            }}>
              <Copy className="h-4 w-4 mr-1" />
              Bruk denne malen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty state */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Ingen maler funnet</p>
          <p className="text-sm">Prøv et annet søkeord</p>
        </div>
      )}
    </div>
  )
}
