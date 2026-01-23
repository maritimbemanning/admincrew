'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Undo,
  Redo,
  Save,
  Eye,
  Edit2,
  Plus,
  Trash2,
  GripVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContractClause {
  id: string
  title: string
  content: string
  required: boolean
}

interface ContractEditorProps {
  initialContent?: {
    title: string
    introduction: string
    clauses: ContractClause[]
  }
  onSave: (content: any) => Promise<void>
  onPreview?: () => void
  className?: string
}

const defaultClauses: ContractClause[] = [
  {
    id: '1',
    title: 'Avtalens formål',
    content: 'Denne avtalen regulerer vilkårene for utleie av mannskap mellom partene.',
    required: true,
  },
  {
    id: '2',
    title: 'Avtalens varighet',
    content: 'Avtalen gjelder fra [startdato] til [sluttdato].',
    required: true,
  },
  {
    id: '3',
    title: 'Vederlag',
    content: 'Oppdragsgiver betaler [beløp] kr eks. mva. per [periode].',
    required: true,
  },
]

export function ContractEditor({
  initialContent,
  onSave,
  onPreview,
  className,
}: ContractEditorProps) {
  const [title, setTitle] = React.useState(initialContent?.title || '')
  const [introduction, setIntroduction] = React.useState(initialContent?.introduction || '')
  const [clauses, setClauses] = React.useState<ContractClause[]>(
    initialContent?.clauses || defaultClauses
  )
  const [activeClauseId, setActiveClauseId] = React.useState<string | null>(null)
  const [isPreview, setIsPreview] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  const activeClause = clauses.find(c => c.id === activeClauseId)

  const handleClauseChange = (id: string, field: keyof ContractClause, value: any) => {
    setClauses(prev => 
      prev.map(clause => 
        clause.id === id ? { ...clause, [field]: value } : clause
      )
    )
  }

  const handleAddClause = () => {
    const newClause: ContractClause = {
      id: crypto.randomUUID(),
      title: 'Ny klausul',
      content: '',
      required: false,
    }
    setClauses(prev => [...prev, newClause])
    setActiveClauseId(newClause.id)
  }

  const handleRemoveClause = (id: string) => {
    setClauses(prev => prev.filter(c => c.id !== id))
    if (activeClauseId === id) {
      setActiveClauseId(null)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({
        title,
        introduction,
        clauses,
        html: generateHtml(),
      })
    } finally {
      setIsSaving(false)
    }
  }

  const generateHtml = () => {
    let html = `<h1>${title}</h1>\n<p>${introduction}</p>\n`
    
    clauses.forEach((clause, index) => {
      html += `<h2>${index + 1}. ${clause.title}</h2>\n<p>${clause.content}</p>\n`
    })

    return html
  }

  return (
    <div className={cn('grid gap-6 lg:grid-cols-3', className)}>
      {/* Clause list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Kontraktstruktur</h3>
          <Button variant="ghost" size="sm" onClick={handleAddClause}>
            <Plus className="h-4 w-4 mr-1" />
            Legg til
          </Button>
        </div>

        <div className="space-y-2">
          {/* Title section */}
          <div
            className={cn(
              'p-3 rounded-lg border cursor-pointer transition-colors',
              !activeClauseId ? 'border-primary bg-primary/5' : 'hover:bg-muted'
            )}
            onClick={() => setActiveClauseId(null)}
          >
            <p className="text-sm font-medium">Tittel & Introduksjon</p>
          </div>

          {/* Clauses */}
          {clauses.map((clause, index) => (
            <div
              key={clause.id}
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors',
                activeClauseId === clause.id 
                  ? 'border-primary bg-primary/5' 
                  : 'hover:bg-muted'
              )}
              onClick={() => setActiveClauseId(clause.id)}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {index + 1}. {clause.title}
                </p>
              </div>
              {clause.required && (
                <Badge variant="secondary" className="text-xs">
                  Påkrevd
                </Badge>
              )}
              {!clause.required && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveClause(clause.id)
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {activeClause ? `Rediger: ${activeClause.title}` : 'Tittel & Introduksjon'}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsPreview(!isPreview)}
                >
                  {isPreview ? (
                    <>
                      <Edit2 className="h-4 w-4 mr-1" />
                      Rediger
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Forhåndsvis
                    </>
                  )}
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-1" />
                  {isSaving ? 'Lagrer...' : 'Lagre'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isPreview ? (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: generateHtml() }}
              />
            ) : activeClause ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="clause-title">Klausul-tittel</Label>
                  <Input
                    id="clause-title"
                    value={activeClause.title}
                    onChange={(e) => handleClauseChange(activeClause.id, 'title', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="clause-content">Innhold</Label>
                  <Textarea
                    id="clause-content"
                    value={activeClause.content}
                    onChange={(e) => handleClauseChange(activeClause.id, 'content', e.target.value)}
                    className="mt-1 min-h-[200px] font-mono text-sm"
                    placeholder="Skriv klausulens innhold her. Bruk [plassholder] for dynamiske verdier."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Tips: Bruk [startdato], [sluttdato], [beløp], etc. for plassholdere.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="contract-title">Kontrakttittel</Label>
                  <Input
                    id="contract-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="F.eks. Oppdragsavtale"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="contract-intro">Introduksjon</Label>
                  <Textarea
                    id="contract-intro"
                    value={introduction}
                    onChange={(e) => setIntroduction(e.target.value)}
                    className="mt-1 min-h-[150px]"
                    placeholder="Innledende tekst som beskriver partene og formålet med avtalen..."
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
