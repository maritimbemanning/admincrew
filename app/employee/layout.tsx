import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarProvider } from '@/components/ui/sidebar'

export const metadata: Metadata = {
  title: 'Ansattportal | AdminCrew',
  description: 'Ansattportal for konsulenter',
}

async function getEmployee() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Get candidate profile for this user
  const { data: candidate } = await supabase
    .from('candidates')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return candidate
}

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const employee = await getEmployee()

  if (!employee) {
    redirect('/login')
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <EmployeeSidebar employee={employee} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}

// Simple employee sidebar component
function EmployeeSidebar({ employee }: { employee: { first_name: string; last_name: string } }) {
  return (
    <aside className="w-64 border-r bg-muted/30 p-4">
      <div className="space-y-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 text-lg font-semibold tracking-tight">
            Ansattportal
          </h2>
          <p className="text-sm text-muted-foreground">
            {employee.first_name} {employee.last_name}
          </p>
        </div>
        <nav className="space-y-1">
          <a
            href="/employee"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
          >
            Oversikt
          </a>
          <a
            href="/employee/assignments"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
          >
            Mine oppdrag
          </a>
          <a
            href="/employee/timesheets"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
          >
            Timelister
          </a>
          <a
            href="/employee/documents"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
          >
            Dokumenter
          </a>
          <a
            href="/employee/contracts"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
          >
            Kontrakter
          </a>
        </nav>
      </div>
    </aside>
  )
}
