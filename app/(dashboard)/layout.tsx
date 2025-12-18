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
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex-1">
              <Button
                variant="outline"
                className="relative h-9 w-full max-w-sm justify-start text-sm text-muted-foreground sm:pr-12"
                onClick={() => setCommandPaletteOpen(true)}
              >
                <Search className="mr-2 h-4 w-4" />
                <span className="hidden lg:inline-flex">Søk eller skriv en kommando...</span>
                <span className="inline-flex lg:hidden">Søk...</span>
                <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
        <CommandMenu />
        <Toaster />
      </KeyboardShortcutsProvider>
    </SidebarProvider>
  )
}
