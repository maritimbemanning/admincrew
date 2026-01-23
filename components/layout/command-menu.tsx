'use client'

import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Users,
  Building2,
  FileText,
  ClipboardList,
  Briefcase,
  Clock,
  Shield,
  Settings,
  Home,
  Plus,
  Moon,
  Sun,
  Laptop,
  History,
  Megaphone,
  Inbox,
  Radar,
} from 'lucide-react'
import { useUIStore, useCommandPaletteOpen, useRecentItems } from '@/stores/ui-store'
import { useKeyboardShortcut, SHORTCUTS } from '@/hooks/use-keyboard-shortcut'
import { cn } from '@/lib/utils'

interface CommandGroup {
  heading: string
  items: CommandItemData[]
}

interface CommandItemData {
  id: string
  label: string
  icon?: React.ReactNode
  shortcut?: string
  onSelect: () => void
  keywords?: string[]
}

export function CommandMenu() {
  const router = useRouter()
  const open = useCommandPaletteOpen()
  const recentItems = useRecentItems()
  const {
    setCommandPaletteOpen,
    registeredCommands,
    theme,
    setTheme,
    addRecentItem,
  } = useUIStore()

  // Toggle command palette with mod+k
  useKeyboardShortcut(SHORTCUTS.COMMAND_PALETTE, () => {
    setCommandPaletteOpen(!open)
  })

  // Close on escape (already handled by Dialog, but explicit)
  useKeyboardShortcut('escape', () => {
    if (open) setCommandPaletteOpen(false)
  }, { enabled: open })

  const navigate = useCallback(
    (href: string, label: string, type: 'candidate' | 'contact' | 'request' | 'assignment' | 'contract' = 'candidate') => {
      router.push(href)
      setCommandPaletteOpen(false)
      addRecentItem({
        id: href,
        type,
        title: label,
        href,
      })
    },
    [router, setCommandPaletteOpen, addRecentItem]
  )

  const navigationCommands: CommandGroup = useMemo(
    () => ({
      heading: 'Navigasjon',
      items: [
        {
          id: 'nav-dashboard',
          label: 'Dashboard',
          icon: <Home className="mr-2 h-4 w-4 text-blue-400" />,
          shortcut: 'G H',
          onSelect: () => navigate('/dashboard', 'Dashboard'),
          keywords: ['hjem', 'home', 'oversikt'],
        },
        {
          id: 'nav-inbox',
          label: 'Innboks',
          icon: <Inbox className="mr-2 h-4 w-4 text-blue-400" />,
          onSelect: () => navigate('/inbox', 'Innboks'),
          keywords: ['inbox', 'nye', 'søknader'],
        },
        {
          id: 'nav-campaigns',
          label: 'Kampanjer',
          icon: <Megaphone className="mr-2 h-4 w-4 text-blue-400" />,
          onSelect: () => navigate('/campaigns', 'Kampanjer'),
          keywords: ['kampanje', 'marketing', 'søknader', 'landing'],
        },
        {
          id: 'nav-candidates',
          label: 'Kandidater',
          icon: <Users className="mr-2 h-4 w-4 text-gold-400" />,
          shortcut: 'G C',
          onSelect: () => navigate('/candidates', 'Kandidater'),
          keywords: ['folk', 'ansatte', 'mannskap'],
        },
        {
          id: 'nav-crm',
          label: 'CRM',
          icon: <Building2 className="mr-2 h-4 w-4 text-emerald-400" />,
          shortcut: 'G O',
          onSelect: () => navigate('/crm', 'CRM'),
          keywords: ['kunder', 'organisasjoner', 'salg'],
        },
        {
          id: 'nav-requests',
          label: 'Requests',
          icon: <ClipboardList className="mr-2 h-4 w-4 text-blue-400" />,
          shortcut: 'G R',
          onSelect: () => navigate('/operations/requests', 'Requests'),
          keywords: ['behov', 'foresporsler'],
        },
        {
          id: 'nav-assignments',
          label: 'Oppdrag',
          icon: <Briefcase className="mr-2 h-4 w-4 text-gold-400" />,
          shortcut: 'G A',
          onSelect: () => navigate('/operations/assignments', 'Oppdrag'),
          keywords: ['assignments', 'jobber'],
        },
        {
          id: 'nav-contracts',
          label: 'Kontrakter',
          icon: <FileText className="mr-2 h-4 w-4 text-emerald-400" />,
          onSelect: () => navigate('/contracts', 'Kontrakter'),
          keywords: ['avtaler', 'signering'],
        },
        {
          id: 'nav-timesheets',
          label: 'Timer',
          icon: <Clock className="mr-2 h-4 w-4 text-blue-400" />,
          onSelect: () => navigate('/timesheets', 'Timer'),
          keywords: ['timeregistrering', 'godkjenning'],
        },
        {
          id: 'nav-qms',
          label: 'QMS',
          icon: <Shield className="mr-2 h-4 w-4 text-blue-400" />,
          onSelect: () => navigate('/qms/documents', 'QMS'),
          keywords: ['kvalitet', 'dokumenter', 'avvik'],
        },
        {
          id: 'nav-settings',
          label: 'Innstillinger',
          icon: <Settings className="mr-2 h-4 w-4 text-muted-foreground" />,
          onSelect: () => navigate('/settings', 'Innstillinger'),
          keywords: ['konfigurasjon', 'profil'],
        },
      ],
    }),
    [navigate]
  )

  const createCommands: CommandGroup = useMemo(
    () => ({
      heading: 'Opprett',
      items: [
        {
          id: 'create-candidate',
          label: 'Ny kandidat',
          icon: <Plus className="mr-2 h-4 w-4 text-emerald-400" />,
          onSelect: () => navigate('/candidates/new', 'Ny kandidat'),
          keywords: ['opprett', 'legg til'],
        },
        {
          id: 'create-contact',
          label: 'Ny kontakt',
          icon: <Plus className="mr-2 h-4 w-4 text-emerald-400" />,
          onSelect: () => navigate('/crm/contacts/new', 'Ny kontakt'),
          keywords: ['opprett', 'kunde'],
        },
        {
          id: 'create-request',
          label: 'Ny request',
          icon: <Plus className="mr-2 h-4 w-4 text-emerald-400" />,
          onSelect: () => navigate('/operations/requests/new', 'Ny request'),
          keywords: ['opprett', 'behov'],
        },
        {
          id: 'create-contract',
          label: 'Ny kontrakt',
          icon: <Plus className="mr-2 h-4 w-4 text-emerald-400" />,
          onSelect: () => navigate('/contracts/new', 'Ny kontrakt'),
          keywords: ['opprett', 'avtale'],
        },
        {
          id: 'create-timesheet',
          label: 'Ny timeregistrering',
          icon: <Plus className="mr-2 h-4 w-4 text-emerald-400" />,
          onSelect: () => navigate('/timesheets/new', 'Ny timeregistrering'),
          keywords: ['opprett', 'timer'],
        },
      ],
    }),
    [navigate]
  )

  const themeCommands: CommandGroup = useMemo(
    () => ({
      heading: 'Tema',
      items: [
        {
          id: 'theme-light',
          label: 'Lyst tema',
          icon: <Sun className="mr-2 h-4 w-4" />,
          onSelect: () => {
            setTheme('light')
            setCommandPaletteOpen(false)
          },
          keywords: ['light', 'hvit'],
        },
        {
          id: 'theme-dark',
          label: 'Mørkt tema',
          icon: <Moon className="mr-2 h-4 w-4" />,
          onSelect: () => {
            setTheme('dark')
            setCommandPaletteOpen(false)
          },
          keywords: ['dark', 'svart'],
        },
        {
          id: 'theme-system',
          label: 'System tema',
          icon: <Laptop className="mr-2 h-4 w-4" />,
          onSelect: () => {
            setTheme('system')
            setCommandPaletteOpen(false)
          },
          keywords: ['auto', 'automatisk'],
        },
      ],
    }),
    [setTheme, setCommandPaletteOpen]
  )

  // Convert recent items to command items
  const recentCommands: CommandGroup | null = useMemo(() => {
    if (recentItems.length === 0) return null
    return {
      heading: 'Nylig besøkt',
      items: recentItems.map((item) => ({
        id: `recent-${item.id}`,
        label: item.title,
        icon: <History className="mr-2 h-4 w-4" />,
        onSelect: () => navigate(item.href, item.title, item.type),
        keywords: [item.subtitle || ''].filter(Boolean),
      })),
    }
  }, [recentItems, navigate])

  // Convert registered commands to command items
  const dynamicCommands: CommandGroup | null = useMemo(() => {
    if (registeredCommands.length === 0) return null
    return {
      heading: 'Handlinger',
      items: registeredCommands.map((cmd) => ({
        id: cmd.id,
        label: cmd.label,
        shortcut: cmd.shortcut,
        onSelect: () => {
          cmd.onSelect()
          setCommandPaletteOpen(false)
        },
        keywords: cmd.keywords,
      })),
    }
  }, [registeredCommands, setCommandPaletteOpen])

  const allGroups = useMemo(() => {
    const groups: CommandGroup[] = []
    if (recentCommands) groups.push(recentCommands)
    groups.push(navigationCommands)
    groups.push(createCommands)
    if (dynamicCommands) groups.push(dynamicCommands)
    groups.push(themeCommands)
    return groups
  }, [recentCommands, navigationCommands, createCommands, dynamicCommands, themeCommands])

  return (
    <CommandDialog
      open={open}
      onOpenChange={setCommandPaletteOpen}
      className="dark:bg-navy-900/95 dark:backdrop-blur-xl dark:border-white/10"
    >
      <div className="flex items-center gap-2 px-3 border-b dark:border-white/10">
        <Radar className="h-4 w-4 text-gold-400 radar-sweep" />
        <CommandInput
          placeholder="Søk i systemet..."
          className="border-0"
        />
        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-60">
          ESC
        </kbd>
      </div>
      <CommandList className="max-h-[400px]">
        <CommandEmpty className="py-12 text-center">
          <Radar className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Ingen resultater funnet</p>
        </CommandEmpty>
        {allGroups.map((group, groupIndex) => (
          <div key={group.heading}>
            {groupIndex > 0 && <CommandSeparator className="dark:bg-white/5" />}
            <CommandGroup heading={group.heading} className="[&_[cmdk-group-heading]]:text-tactical [&_[cmdk-group-heading]]:text-gold-400/70">
              {group.items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.label} ${item.keywords?.join(' ') || ''}`}
                  onSelect={item.onSelect}
                  className="dark:data-[selected=true]:bg-gold-500/10"
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && (
                    <span className="ml-auto text-xs font-mono text-white/40 tracking-wider">
                      {item.shortcut}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
