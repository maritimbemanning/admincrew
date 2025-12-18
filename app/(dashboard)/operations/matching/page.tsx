'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Construction, Sparkles } from 'lucide-react'

export default function QuickMatchPage() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          Quick Match
        </h1>
        <p className="text-muted-foreground mt-1">
          Finn riktig kandidat på 10 sekunder
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
            Quick Match er kjernen i AdminCrew - her vil du kunne søke etter
            kandidater basert på rolle, sertifikater, tilgjengelighet og erfaring,
            og få matchede resultater på under 10 sekunder.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
