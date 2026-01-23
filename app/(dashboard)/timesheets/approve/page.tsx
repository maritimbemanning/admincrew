import { ApprovalQueue } from '@/components/timesheets'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function TimesheetApprovePage() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <Link href="/timesheets">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til timeregistrering
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Godkjenninger</h1>
        <p className="text-muted-foreground mt-1">
          Gjennomgå og godkjenn innsendte timeregistreringer
        </p>
      </div>

      <ApprovalQueue />
    </div>
  )
}
