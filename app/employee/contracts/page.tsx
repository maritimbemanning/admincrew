'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileSignature,
  FileText
} from 'lucide-react'

// Mock contracts data
const contracts = [
  {
    id: '1',
    type: 'assignment',
    title: 'Oppdragskontrakt - Equinor ASA',
    client: 'Equinor ASA',
    status: 'signed',
    signedAt: '2024-01-10',
    startDate: '2024-01-15',
    endDate: '2024-12-31',
    parties: [
      { name: 'AdminCrew AS', role: 'Leverandør', signedAt: '2024-01-08' },
      { name: 'Ola Nordmann', role: 'Konsulent', signedAt: '2024-01-10' },
      { name: 'Equinor ASA', role: 'Oppdragsgiver', signedAt: '2024-01-10' },
    ],
  },
  {
    id: '2',
    type: 'employment',
    title: 'Rammeavtale - Konsulent',
    client: 'AdminCrew AS',
    status: 'signed',
    signedAt: '2024-01-05',
    startDate: '2024-01-01',
    endDate: null,
    parties: [
      { name: 'AdminCrew AS', role: 'Arbeidsgiver', signedAt: '2024-01-05' },
      { name: 'Ola Nordmann', role: 'Konsulent', signedAt: '2024-01-05' },
    ],
  },
  {
    id: '3',
    type: 'assignment',
    title: 'Oppdragskontrakt - DNB ASA',
    client: 'DNB ASA',
    status: 'signed',
    signedAt: '2023-01-05',
    startDate: '2023-01-10',
    endDate: '2023-12-20',
    parties: [
      { name: 'AdminCrew AS', role: 'Leverandør', signedAt: '2023-01-05' },
      { name: 'Ola Nordmann', role: 'Konsulent', signedAt: '2023-01-05' },
      { name: 'DNB ASA', role: 'Oppdragsgiver', signedAt: '2023-01-05' },
    ],
  },
  {
    id: '4',
    type: 'nda',
    title: 'Taushetserklæring - Statoil',
    client: 'Equinor ASA',
    status: 'pending_signature',
    signedAt: null,
    startDate: null,
    endDate: null,
    parties: [
      { name: 'Ola Nordmann', role: 'Underskriver', signedAt: null },
    ],
  },
]

function getStatusBadge(status: string) {
  switch (status) {
    case 'signed':
      return <Badge className="bg-green-100 text-green-800">Signert</Badge>
    case 'pending_signature':
      return <Badge className="bg-yellow-100 text-yellow-800">Venter signatur</Badge>
    case 'expired':
      return <Badge variant="secondary">Utløpt</Badge>
    case 'draft':
      return <Badge variant="outline">Utkast</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    assignment: 'Oppdragskontrakt',
    employment: 'Rammeavtale',
    nda: 'Taushetserklæring',
    amendment: 'Endringsavtale',
  }
  return labels[type] || type
}

export default function EmployeeContractsPage() {
  const [selectedContract, setSelectedContract] = React.useState(contracts[0])

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mine kontrakter</h1>
        <p className="text-muted-foreground">
          Oversikt over dine kontrakter og avtaler.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contract List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold">Alle kontrakter</h2>
          <div className="space-y-2">
            {contracts.map((contract) => (
              <Card
                key={contract.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedContract.id === contract.id ? 'border-primary' : ''
                }`}
                onClick={() => setSelectedContract(contract)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{contract.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {getTypeLabel(contract.type)}
                      </p>
                    </div>
                    {getStatusBadge(contract.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contract Details */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selectedContract.title}</CardTitle>
                  <CardDescription>
                    {getTypeLabel(selectedContract.type)}
                  </CardDescription>
                </div>
                {getStatusBadge(selectedContract.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contract info */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Oppdragsgiver</p>
                    <p className="font-medium">{selectedContract.client}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Startdato</p>
                    <p className="font-medium">
                      {selectedContract.startDate
                        ? new Date(selectedContract.startDate).toLocaleDateString('nb-NO')
                        : '-'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Sluttdato</p>
                    <p className="font-medium">
                      {selectedContract.endDate
                        ? new Date(selectedContract.endDate).toLocaleDateString('nb-NO')
                        : 'Løpende'}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Signing parties */}
              <div>
                <h3 className="font-semibold mb-4">Signaturstatus</h3>
                <div className="space-y-3">
                  {selectedContract.parties.map((party, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {party.signedAt ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        )}
                        <div>
                          <p className="font-medium">{party.name}</p>
                          <p className="text-sm text-muted-foreground">{party.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {party.signedAt ? (
                          <p className="text-sm text-muted-foreground">
                            Signert {new Date(party.signedAt).toLocaleDateString('nb-NO')}
                          </p>
                        ) : (
                          <Badge variant="outline">Venter</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex gap-2">
                {selectedContract.status === 'pending_signature' ? (
                  <Button className="flex-1">
                    <FileSignature className="mr-2 h-4 w-4" />
                    Signer kontrakt
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" className="flex-1">
                      <Eye className="mr-2 h-4 w-4" />
                      Vis kontrakt
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Last ned PDF
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
