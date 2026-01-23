'use client'

import { useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { Toaster } from '@/components/ui/sonner'
import { CommandMenu } from '@/components/layout/command-menu'
import { useKeyboardShortcuts, SHORTCUTS } from '@/hooks/use-keyboard-shortcut'
import { useUIStore } from '@/stores/ui-store'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { Search } from 'lucide-react'

function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { toggleSidebar, setCommandPaletteOpen } = useUIStore()

  // Register global keyboard shortcuts
  useKeyboardShortcuts([
    // Toggle sidebar
    { key: SHORTCUTS.TOGGLE_SIDEBAR, callback: () => toggleSidebar() },

    // Navigation shortcuts
    { key: SHORTCUTS.GO_DASHBOARD, callback: () => router.push('/dashboard') },
    { key: SHORTCUTS.GO_CANDIDATES, callback: () => router.push('/candidates') },
    { key: SHORTCUTS.GO_CRM, callback: () => router.push('/crm') },
    { key: SHORTCUTS.GO_REQUESTS, callback: () => router.push('/operations/requests') },
    { key: SHORTCUTS.GO_ASSIGNMENTS, callback: () => router.push('/operations/assignments') },
  ])

  return <>{children}</>
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { setCommandPaletteOpen } = useUIStore()

  return (
    <SidebarProvider>
      <KeyboardShortcutsProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border/50 bg-card/50 backdrop-blur-sm px-6">
            <SidebarTrigger className="-ml-2 text-muted-foreground hover:text-foreground" />
            <Separator orientation="vertical" className="mr-2 h-5 bg-border/50" />
            <div className="flex-1">
              <Button
                variant="outline"
                className="relative h-10 w-full max-w-md justify-start text-sm text-muted-foreground border-border/50 bg-background/50 hover:bg-background hover:border-gold-500/50 sm:pr-12"
                onClick={() => setCommandPaletteOpen(true)}
              >
                <Search className="mr-2 h-4 w-4 text-gold-500" />
                <span className="hidden lg:inline-flex">Søk kandidater, organisasjoner, oppdrag...</span>
                <span className="inline-flex lg:hidden">Søk...</span>
                <kbd className="pointer-events-none absolute right-2 top-2 hidden h-6 select-none items-center gap-1 rounded-md border border-border/50 bg-slate-100 dark:bg-navy-800 px-2 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto bg-slate-50 dark:bg-navy-900">
            <div className="container-premium py-8">
              {children}
            </div>
          </main>
        </SidebarInset>
        <CommandMenu />
        <Toaster />
      </KeyboardShortcutsProvider>
    </SidebarProvider>
  )
}
