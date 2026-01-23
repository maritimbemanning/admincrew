'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Search,
  Upload
} from 'lucide-react'

// Mock documents data
const documents = [
  {
    id: '1',
    name: 'Arbeidskontrakt',
    type: 'contract',
    status: 'valid',
    uploadedAt: '2024-01-10',
    expiresAt: null,
    fileSize: '245 KB',
  },
  {
    id: '2',
    name: 'HMS-kurs sertifikat',
    type: 'certification',
    status: 'expiring',
    uploadedAt: '2022-03-15',
    expiresAt: '2024-03-15',
    fileSize: '128 KB',
  },
  {
    id: '3',
    name: 'Sikkerhetsklarering',
    type: 'clearance',
    status: 'expiring',
    uploadedAt: '2022-02-28',
    expiresAt: '2024-02-28',
    fileSize: '312 KB',
  },
  {
    id: '4',
    name: 'CV',
    type: 'cv',
    status: 'valid',
    uploadedAt: '2024-11-01',
    expiresAt: null,
    fileSize: '156 KB',
  },
  {
    id: '5',
    name: 'PMP Sertifisering',
    type: 'certification',
    status: 'valid',
    uploadedAt: '2023-06-20',
    expiresAt: '2026-06-20',
    fileSize: '89 KB',
  },
  {
    id: '6',
    name: 'Førerkort',
    type: 'identification',
    status: 'valid',
    uploadedAt: '2024-01-05',
    expiresAt: '2030-01-05',
    fileSize: '45 KB',
  },
]

const requiredDocuments = [
  { type: 'cv', name: 'CV', uploaded: true },
  { type: 'identification', name: 'ID-dokument', uploaded: true },
  { type: 'contract', name: 'Arbeidskontrakt', uploaded: true },
  { type: 'hms', name: 'HMS-kurs', uploaded: true },
  { type: 'bank', name: 'Bankopplysninger', uploaded: false },
]

function getStatusBadge(status: string) {
  switch (status) {
    case 'valid':
      return <Badge className="bg-green-100 text-green-800">Gyldig</Badge>
    case 'expiring':
      return <Badge variant="destructive">Utløper snart</Badge>
    case 'expired':
      return <Badge variant="destructive">Utløpt</Badge>
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800">Venter</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    contract: 'Kontrakt',
    certification: 'Sertifisering',
    clearance: 'Klarering',
    cv: 'CV',
    identification: 'Identifikasjon',
  }
  return labels[type] || type
}

export default function EmployeeDocumentsPage() {
  const [searchQuery, setSearchQuery] = React.useState('')

  const completedDocs = requiredDocuments.filter((d) => d.uploaded).length
  const totalDocs = requiredDocuments.length
  const completionPercentage = (completedDocs / totalDocs) * 100

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mine dokumenter</h1>
        <p className="text-muted-foreground">
          Last opp og administrer dine dokumenter og sertifiseringer.
        </p>
      </div>

      {/* Compliance Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Dokumentstatus</CardTitle>
          <CardDescription>
            Din dokumentkompletthet påvirker hvilke oppdrag du kan ta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {completedDocs} av {totalDocs} påkrevde dokumenter
            </span>
            <span className="text-sm text-muted-foreground">
              {completionPercentage.toFixed(0)}%
            </span>
          </div>
          <Progress value={completionPercentage} />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {requiredDocuments.map((doc) => (
              <div
                key={doc.type}
                className={`flex items-center gap-2 p-2 rounded-lg border ${
                  doc.uploaded
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                {doc.uploaded ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className="text-xs font-medium">{doc.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Tabs defaultValue="all">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">Alle</TabsTrigger>
            <TabsTrigger value="certifications">Sertifiseringer</TabsTrigger>
            <TabsTrigger value="contracts">Kontrakter</TabsTrigger>
            <TabsTrigger value="expiring">Utløper snart</TabsTrigger>
          </TabsList>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Last opp
          </Button>
        </div>

        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk i dokumenter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <TabsContent value="all" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{doc.name}</p>
                        {getStatusBadge(doc.status)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getTypeLabel(doc.type)}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{doc.fileSize}</span>
                        {doc.expiresAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Utløper {new Date(doc.expiresAt).toLocaleDateString('nb-NO')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Last ned
                    </Button>
                    {doc.status === 'expiring' && (
                      <Button size="sm" className="flex-1">
                        <Upload className="mr-2 h-4 w-4" />
                        Oppdater
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="certifications" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments
              .filter((doc) => doc.type === 'certification')
              .map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{doc.name}</p>
                          {getStatusBadge(doc.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {doc.expiresAt && (
                            <>Utløper {new Date(doc.expiresAt).toLocaleDateString('nb-NO')}</>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="contracts" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments
              .filter((doc) => doc.type === 'contract')
              .map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium">{doc.name}</p>
                        {getStatusBadge(doc.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="expiring" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments
              .filter((doc) => doc.status === 'expiring')
              .map((doc) => (
                <Card key={doc.id} className="border-destructive">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-xs text-destructive">
                          Utløper {new Date(doc.expiresAt!).toLocaleDateString('nb-NO')}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" className="w-full mt-4">
                      <Upload className="mr-2 h-4 w-4" />
                      Last opp nytt dokument
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
