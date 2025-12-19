'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  PenTool,
  ShieldCheck,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { SignatureStatus } from '@/components/contracts/signature-status'

// Mock data - vil bli erstattet med ekte API-kall
const mockContract = {
  id: '1',
  title: 'Oppdragsavtale - Hurtigruten AS',
  type: 'employment',
  status: 'pending_signatures',
  created_at: '2025-01-10',
  content: `
    <h1>OPPDRAGSAVTALE</h1>
    <p>Denne avtalen inngås mellom BlueCrew AS (heretter "Leverandør") og Hurtigruten AS (heretter "Oppdragsgiver").</p>
    <h2>1. AVTALENS FORMÅL</h2>
    <p>Avtalen regulerer utleie av mannskap for oppdrag på MS Nordlys i perioden 15.01.2025 - 15.04.2025.</p>
    <h2>2. MANNSKAP</h2>
    <p>Leverandør stiller følgende mannskap til disposisjon:</p>
    <ul>
      <li>Ole Hansen - Kaptein</li>
      <li>Kari Nordmann - Styrmann</li>
    </ul>
    <h2>3. VEDERLAG</h2>
    <p>Oppdragsgiver betaler kr 850 000,- eks. mva for hele perioden.</p>
  `,
  parties: [
    {
      id: '1',
      name: 'Isak Dirdal',
      email: 'isak@bluecrew.no',
      role: 'Daglig leder, BlueCrew AS',
      type: 'company',
      has_signed: true,
      signed_at: '2025-01-10T14:30:00',
    },
    {
      id: '2',
      name: 'Erik Olsen',
      email: 'erik@hurtigruten.no',
      role: 'Innkjøpssjef, Hurtigruten AS',
      type: 'customer',
      has_signed: false,
      signed_at: null,
    },
    {
      id: '3',
      name: 'Ole Hansen',
      email: 'ole@bluecrew.no',
      role: 'Kaptein (Ansatt)',
      type: 'employee',
      has_signed: false,
      signed_at: null,
    },
  ],
}

export default function ContractSigningPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [contract, setContract] = useState(mockContract)
  const [hasReadContract, setHasReadContract] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  
  // Simulerer at brukeren er en av partene
  const currentUserPartyId = '2' // Erik Olsen (kunde)
  const currentParty = contract.parties.find(p => p.id === currentUserPartyId)

  const handleSign = async () => {
    if (!hasReadContract) {
      toast.error('Du må bekrefte at du har lest kontrakten')
      return
    }

    setIsSigning(true)
    
    try {
      // Her ville vi initialisert BankID eller annen signering
      // Simulerer signeringsprosess
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Oppdater lokal state
      setContract(prev => ({
        ...prev,
        parties: prev.parties.map(p => 
          p.id === currentUserPartyId 
            ? { ...p, has_signed: true, signed_at: new Date().toISOString() }
            : p
        ),
      }))

      toast.success('Kontrakt signert!', {
        description: 'Du vil motta en bekreftelse på e-post.',
      })
    } catch (error) {
      toast.error('Signering feilet', {
        description: 'Prøv igjen eller kontakt support.',
      })
    } finally {
      setIsSigning(false)
    }
  }

  const signedCount = contract.parties.filter(p => p.has_signed).length
  const totalCount = contract.parties.length
  const allSigned = signedCount === totalCount

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Signering av kontrakt</h1>
          </div>
          <p className="text-muted-foreground">
            Les gjennom kontrakten og signer digitalt med BankID.
          </p>
        </div>

        {/* Status bar */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Opprettet {new Date(contract.created_at).toLocaleDateString('nb-NO')}
                  </span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2">
                  {allSigned ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="text-sm">
                    {signedCount} av {totalCount} signaturer
                  </span>
                </div>
              </div>
              <Badge variant={allSigned ? 'default' : 'secondary'}>
                {allSigned ? 'Fullført' : 'Venter på signaturer'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Contract content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{contract.title}</CardTitle>
                <CardDescription>
                  Les gjennom hele kontrakten før du signerer.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm max-w-none border rounded-lg p-6 bg-white dark:bg-zinc-900 max-h-[500px] overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: contract.content }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Signature panel */}
          <div className="space-y-6">
            {/* Parties */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Signaturstatus</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contract.parties.map((party) => (
                  <div 
                    key={party.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{party.name}</p>
                        <p className="text-xs text-muted-foreground">{party.role}</p>
                      </div>
                    </div>
                    {party.has_signed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Sign action */}
            {currentParty && !currentParty.has_signed && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <PenTool className="h-4 w-4" />
                    Din signatur
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="read-confirm"
                      checked={hasReadContract}
                      onCheckedChange={(checked) => setHasReadContract(checked as boolean)}
                    />
                    <Label 
                      htmlFor="read-confirm" 
                      className="text-sm leading-tight cursor-pointer"
                    >
                      Jeg bekrefter at jeg har lest og forstått kontrakten, og godtar vilkårene.
                    </Label>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handleSign}
                    disabled={!hasReadContract || isSigning}
                  >
                    {isSigning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signerer med BankID...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Signer med BankID
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Du vil bli omdirigert til BankID for sikker signering.
                  </p>
                </CardContent>
              </Card>
            )}

            {currentParty?.has_signed && (
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                <CardContent className="py-6 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <p className="font-medium">Du har signert</p>
                  <p className="text-sm text-muted-foreground">
                    Signert {new Date(currentParty.signed_at!).toLocaleDateString('nb-NO', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
