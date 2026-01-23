'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Construction } from 'lucide-react'

export default function CompliancePage() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Compliance-kø</h1>
        <p className="text-muted-foreground mt-1">
          Kandidater som venter på compliance-godkjenning
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5" />
            Under utvikling
          </CardTitle>
          <CardDescription>
            Denne funksjonen er under utvikling og vil være tilgjengelig snart.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Her vil du kunne se og behandle kandidater som venter på compliance-sjekk,
            dokumentverifisering og godkjenning.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
