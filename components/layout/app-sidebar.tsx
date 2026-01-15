'use client'

import { useEffect, useState } from 'react'
import {
  Users,
  Building2,
  ClipboardList,
  FileText,
  Clock,
  Receipt,
  ShieldCheck,
  Settings,
  LayoutDashboard,
  ChevronDown,
  Search,
  UserCircle,
  LogOut,
  Inbox,
  Megaphone,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUIStore } from '@/stores/ui-store'
import type { User } from '@supabase/supabase-js'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const navigation = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    title: 'Innboks',
    icon: Inbox,
    href: '/inbox',
  },
  {
    title: 'Kampanjer',
    icon: Megaphone,
    href: '/campaigns',
  },
  {
    title: 'Kandidater',
    icon: Users,
    href: '/candidates',
    items: [
      { title: 'Alle kandidater', href: '/candidates' },
      { title: 'Compliance-kø', href: '/candidates/compliance' },
      { title: 'Ny kandidat', href: '/candidates/new' },
    ],
  },
  {
    title: 'CRM',
    icon: Building2,
    href: '/crm',
    items: [
      { title: 'Pipeline', href: '/crm' },
      { title: 'Kontakter', href: '/crm/contacts' },
      { title: 'Oppgaver', href: '/crm/tasks' },
    ],
  },
  {
    title: 'Operations',
    icon: ClipboardList,
    href: '/operations',
    items: [
      { title: 'Requests', href: '/operations/requests' },
      { title: 'Oppdrag', href: '/operations/assignments' },
      { title: 'Quick Match', href: '/operations/matching' },
    ],
  },
  {
    title: 'Kontrakter',
    icon: FileText,
    href: '/contracts',
    items: [
      { title: 'Alle kontrakter', href: '/contracts' },
      { title: 'Maler', href: '/contracts/templates' },
    ],
  },
  {
    title: 'Timer',
    icon: Clock,
    href: '/timesheets',
    items: [
      { title: 'Oversikt', href: '/timesheets' },
      { title: 'Godkjenning', href: '/timesheets/approve' },
    ],
  },
  {
    title: 'Økonomi',
    icon: Receipt,
    href: '/finance',
    items: [
      { title: 'Fakturaer', href: '/finance/invoices' },
      { title: 'Rapporter', href: '/finance/reports' },
    ],
  },
  {
    title: 'QMS',
    icon: ShieldCheck,
    href: '/qms',
    items: [
      { title: 'Dokumenter', href: '/qms/documents' },
      { title: 'Avvik', href: '/qms/nonconformities' },
      { title: 'Risiko', href: '/qms/risks' },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { setCommandPaletteOpen } = useUIStore()
  const [user, setUser] = useState<User | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Get user display info
  const userDisplayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Bruker'
  const userEmail = user?.email || ''
  const userInitials = userDisplayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="border-b border-sidebar-border pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-gold-500 text-navy-900 shadow-sm">
                  <span className="font-medium text-lg">BC</span>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium text-cream-50">AdminCrew</span>
                  <span className="truncate text-xs text-gold-400">Operations Hub</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Quick Search */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="w-full justify-start gap-2 text-cream-100/70 hover:text-cream-50 hover:bg-navy-700/50 mt-2"
              onClick={() => setCommandPaletteOpen(true)}
            >
              <Search className="h-4 w-4 text-gold-400" />
              <span>Hurtigsøk...</span>
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-md border border-navy-700 bg-navy-800 px-1.5 font-mono text-[10px] font-medium text-cream-100/50">
                <span className="text-xs">⌘</span>K
              </kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigasjon</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                if (item.items) {
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.href}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.href}
                            >
                              <Link href={subItem.href}>{subItem.title}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </SidebarMenuItem>
                  )
                }

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Innstillinger</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname.startsWith('/settings')}>
                  <Link href="/settings">
                    <Settings className="h-4 w-4" />
                    <span>Innstillinger</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border pt-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="hover:bg-navy-700/50">
                  <Avatar className="h-8 w-8 border border-gold-500/30">
                    <AvatarImage src={user?.user_metadata?.avatar_url || ''} />
                    <AvatarFallback className="bg-gold-500 text-navy-900 font-medium text-sm">{userInitials || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium text-cream-50">{userDisplayName}</span>
                    <span className="truncate text-xs text-cream-100/60">{userEmail}</span>
                  </div>
                  <ChevronDown className="ml-auto h-4 w-4 text-cream-100/50" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-[--radix-dropdown-menu-trigger-width]"
              >
                <DropdownMenuItem asChild>
                  <Link href="/settings/profile">
                    <UserCircle className="mr-2 h-4 w-4" />
                    Min profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoggingOut ? 'Logger ut...' : 'Logg ut'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
