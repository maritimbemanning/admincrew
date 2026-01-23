// app/(dashboard)/inbox/inbox-client.tsx
'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  InboxStats,
  JobApplicationList,
  InterestLeadList,
  StaffingNeedList,
  PortalContactList
} from '@/components/portal'
import { 
  FileUser, 
  Users, 
  Briefcase, 
  MessageSquare,
  Inbox
} from 'lucide-react'

export function InboxClient() {
  const [activeTab, setActiveTab] = useState('applications')

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Inbox className="h-6 w-6" />
            Innboks
          </h1>
          <p className="text-muted-foreground">
            Alle innkommende data fra bluecrew.no portalen
          </p>
        </div>
      </div>

      {/* Stats */}
      <InboxStats />

      {/* Tabs for ulike typer data */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <FileUser className="h-4 w-4" />
            <span className="hidden sm:inline">Jobbsøknader</span>
            <span className="sm:hidden">Søknader</span>
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Interesse-leads</span>
            <span className="sm:hidden">Leads</span>
          </TabsTrigger>
          <TabsTrigger value="staffing" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Bemanningsbehov</span>
            <span className="sm:hidden">Behov</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Kontakt</span>
            <span className="sm:hidden">Kontakt</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="applications" className="m-0">
            <JobApplicationList />
          </TabsContent>

          <TabsContent value="leads" className="m-0">
            <InterestLeadList />
          </TabsContent>

          <TabsContent value="staffing" className="m-0">
            <StaffingNeedList />
          </TabsContent>

          <TabsContent value="contacts" className="m-0">
            <PortalContactList />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
