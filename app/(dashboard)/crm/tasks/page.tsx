'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Construction } from 'lucide-react'

export default function CRMTasksPage() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Oppgaver</h1>
        <p className="text-muted-foreground mt-1">
          CRM-oppgaver og påminnelser
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
            Her vil du kunne opprette og administrere oppgaver, sette påminnelser,
            og følge opp aktiviteter knyttet til organisasjoner og kontakter.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
