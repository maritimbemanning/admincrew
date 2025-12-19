'use client'

import { useState } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ExternalLink,
  Key,
  Link2,
  RefreshCw,
  Settings,
  Unlink,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface Integration {
  id: string
  name: string
  description: string
  logo: string
  category: 'accounting' | 'esign' | 'communication' | 'other'
  status: 'connected' | 'disconnected' | 'error'
  lastSync?: string
  config?: Record<string, any>
}

const integrations: Integration[] = [
  {
    id: 'tripletex',
    name: 'Tripletex',
    description: 'Regnskap og fakturering',
    logo: '📊',
    category: 'accounting',
    status: 'connected',
    lastSync: '2025-01-12T10:00:00',
  },
  {
    id: 'signicat',
    name: 'Signicat / BankID',
    description: 'Digital signering med BankID',
    logo: '🔐',
    category: 'esign',
    status: 'connected',
    lastSync: '2025-01-12T09:30:00',
  },
  {
    id: 'resend',
    name: 'Resend',
    description: 'E-postutsending',
    logo: '✉️',
    category: 'communication',
    status: 'connected',
    lastSync: '2025-01-12T08:15:00',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'SMS-varsling',
    logo: '📱',
    category: 'communication',
    status: 'disconnected',
  },
  {
    id: 'bluecrew',
    name: 'BlueCrew.no',
    description: 'Kandidatportal synkronisering',
    logo: '🌊',
    category: 'other',
    status: 'connected',
    lastSync: '2025-01-12T06:00:00',
  },
]

const categoryLabels: Record<string, string> = {
  accounting: 'Regnskap',
  esign: 'Digital signering',
  communication: 'Kommunikasjon',
  other: 'Annet',
}

export default function IntegrationsSettingsPage() {
  const [integrationList, setIntegrationList] = useState(integrations)

  const handleConnect = (id: string) => {
    // TODO: Implement OAuth flow
    toast.success('Kobling startet', {
      description: 'Du blir omdirigert for å godkjenne tilgangen.',
    })
  }

  const handleDisconnect = (id: string) => {
    setIntegrationList(prev =>
      prev.map(i => i.id === id ? { ...i, status: 'disconnected' as const } : i)
    )
    toast.success('Kobling fjernet')
  }

  const handleSync = (id: string) => {
    toast.promise(
      new Promise(resolve => setTimeout(resolve, 2000)),
      {
        loading: 'Synkroniserer...',
        success: 'Synkronisering fullført',
        error: 'Synkronisering feilet',
      }
    )
  }

  const formatLastSync = (date: string | undefined) => {
    if (!date) return null
    return new Date(date).toLocaleString('nb-NO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  // Group by category
  const groupedIntegrations = integrationList.reduce((acc, integration) => {
    if (!acc[integration.category]) {
      acc[integration.category] = []
    }
    acc[integration.category].push(integration)
    return acc
  }, {} as Record<string, Integration[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Integrasjoner</h1>
        <p className="text-muted-foreground">
          Koble til eksterne tjenester og systemer
        </p>
      </div>

      {/* Integration Groups */}
      {Object.entries(groupedIntegrations).map(([category, items]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{categoryLabels[category]}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((integration, index) => (
              <div key={integration.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
                      {integration.logo}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{integration.name}</h3>
                        {getStatusIcon(integration.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {integration.description}
                      </p>
                      {integration.lastSync && integration.status === 'connected' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Sist synkronisert: {formatLastSync(integration.lastSync)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {integration.status === 'connected' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(integration.id)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Synk
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Innstillinger
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDisconnect(integration.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Unlink className="h-4 w-4 mr-1" />
                          Koble fra
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(integration.id)}
                      >
                        <Link2 className="h-4 w-4 mr-1" />
                        Koble til
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API-nøkler
          </CardTitle>
          <CardDescription>
            Administrer API-nøkler for ekstern tilgang
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Produksjons-nøkkel</p>
                <p className="text-sm text-muted-foreground">
                  sk_prod_****************************
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Vis
                </Button>
                <Button variant="outline" size="sm">
                  Kopier
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Test-nøkkel</p>
                <p className="text-sm text-muted-foreground">
                  sk_test_****************************
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Vis
                </Button>
                <Button variant="outline" size="sm">
                  Kopier
                </Button>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              <Key className="h-4 w-4 mr-2" />
              Generer ny nøkkel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle>Webhooks</CardTitle>
          <CardDescription>
            Konfigurer hendelsesbaserte meldinger til eksterne systemer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <p className="font-medium">Kandidat-oppdateringer</p>
                <code className="text-xs text-muted-foreground">
                  https://api.example.com/webhooks/candidates
                </code>
              </div>
              <div className="flex items-center gap-4">
                <Switch defaultChecked />
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <p className="font-medium">Kontrakter signert</p>
                <code className="text-xs text-muted-foreground">
                  https://api.example.com/webhooks/contracts
                </code>
              </div>
              <div className="flex items-center gap-4">
                <Switch defaultChecked />
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Legg til webhook
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
