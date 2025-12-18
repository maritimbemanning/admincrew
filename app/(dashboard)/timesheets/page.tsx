import { TimesheetList } from '@/components/timesheets'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ApprovalQueue } from '@/components/timesheets'

export default function TimesheetsPage() {
  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Timeregistrering</h1>
        <p className="text-muted-foreground mt-1">
          Administrer timer, godkjenninger og rapporter
        </p>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Alle</TabsTrigger>
          <TabsTrigger value="pending">Til godkjenning</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <TimesheetList />
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <ApprovalQueue />
        </TabsContent>
      </Tabs>
    </div>
  )
}
