import { create } from 'zustand'

export interface CommandItem {
  id: string
  title: string
  description?: string
  icon?: string
  category: string
  keywords: string[]
  shortcut?: string
  action: () => void | Promise<void>
}

export interface RecentCommand {
  id: string
  title: string
  category: string
  timestamp: number
}

export interface CommandStoreState {
  // Command palette state
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void

  // Search
  search: string
  setSearch: (search: string) => void

  // Categories
  activeCategory: string | null
  setActiveCategory: (category: string | null) => void

  // Commands
  commands: CommandItem[]
  registerCommands: (commands: CommandItem[]) => void
  unregisterCommands: (ids: string[]) => void
  clearCommands: () => void

  // Recent commands
  recentCommands: RecentCommand[]
  addRecentCommand: (command: RecentCommand) => void
  clearRecentCommands: () => void

  // Filtered commands
  getFilteredCommands: () => CommandItem[]
}

export const useCommandStore = create<CommandStoreState>()((set, get) => ({
  // Command palette state
  isOpen: false,
  open: () => set({ isOpen: true, search: '' }),
  close: () => set({ isOpen: false, search: '', activeCategory: null }),
  toggle: () =>
    set((state) => ({
      isOpen: !state.isOpen,
      search: state.isOpen ? '' : state.search,
      activeCategory: state.isOpen ? null : state.activeCategory,
    })),

  // Search
  search: '',
  setSearch: (search) => set({ search }),

  // Categories
  activeCategory: null,
  setActiveCategory: (category) => set({ activeCategory: category }),

  // Commands
  commands: [],
  registerCommands: (newCommands) =>
    set((state) => {
      const existingIds = new Set(state.commands.map((c) => c.id))
      const uniqueCommands = newCommands.filter((c) => !existingIds.has(c.id))
      return { commands: [...state.commands, ...uniqueCommands] }
    }),
  unregisterCommands: (ids) =>
    set((state) => ({
      commands: state.commands.filter((c) => !ids.includes(c.id)),
    })),
  clearCommands: () => set({ commands: [] }),

  // Recent commands
  recentCommands: [],
  addRecentCommand: (command) =>
    set((state) => {
      const filtered = state.recentCommands.filter((c) => c.id !== command.id)
      const updated = [command, ...filtered].slice(0, 10)
      return { recentCommands: updated }
    }),
  clearRecentCommands: () => set({ recentCommands: [] }),

  // Filtered commands
  getFilteredCommands: () => {
    const { commands, search, activeCategory } = get()
    
    let filtered = commands

    if (activeCategory) {
      filtered = filtered.filter((c) => c.category === activeCategory)
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(searchLower) ||
          c.description?.toLowerCase().includes(searchLower) ||
          c.keywords.some((k) => k.toLowerCase().includes(searchLower))
      )
    }

    return filtered
  },
}))
