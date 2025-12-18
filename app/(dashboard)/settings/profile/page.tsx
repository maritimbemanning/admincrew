'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Construction } from 'lucide-react'

export default function ProfileSettingsPage() {
  return (
    <div className="container py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Min profil</h1>
        <p className="text-muted-foreground mt-1">
          Administrer din brukerinformasjon
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
            Her vil du kunne oppdatere navn, e-post, telefon, avatar og andre
            personlige innstillinger for din brukerkonto.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
