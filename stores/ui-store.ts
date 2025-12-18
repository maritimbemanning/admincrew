import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CommandItem {
  id: string
  label: string
  shortcut?: string
  icon?: string
  group?: string
  onSelect: () => void
  keywords?: string[]
}

interface RecentItem {
  id: string
  type: 'candidate' | 'contact' | 'request' | 'assignment' | 'contract'
  title: string
  subtitle?: string
  href: string
  timestamp: number
}

interface UIState {
  // Sidebar
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void

  // Command palette
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  toggleCommandPalette: () => void
  registeredCommands: CommandItem[]
  registerCommands: (commands: CommandItem[]) => void
  unregisterCommands: (ids: string[]) => void

  // Recent items
  recentItems: RecentItem[]
  addRecentItem: (item: Omit<RecentItem, 'timestamp'>) => void
  clearRecentItems: () => void

  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // Global loading
  globalLoading: boolean
  setGlobalLoading: (loading: boolean) => void

  // Search focus
  searchFocused: boolean
  setSearchFocused: (focused: boolean) => void

  // Filters panel
  filtersPanelOpen: boolean
  setFiltersPanelOpen: (open: boolean) => void
  toggleFiltersPanel: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Sidebar
      sidebarOpen: true,
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // Command palette
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
      registeredCommands: [],
      registerCommands: (commands) =>
        set((state) => ({
          registeredCommands: [
            ...state.registeredCommands.filter(
              (c) => !commands.some((nc) => nc.id === c.id)
            ),
            ...commands,
          ],
        })),
      unregisterCommands: (ids) =>
        set((state) => ({
          registeredCommands: state.registeredCommands.filter(
            (c) => !ids.includes(c.id)
          ),
        })),

      // Recent items
      recentItems: [],
      addRecentItem: (item) =>
        set((state) => {
          const newItem: RecentItem = { ...item, timestamp: Date.now() }
          const filtered = state.recentItems.filter((r) => r.id !== item.id)
          return {
            recentItems: [newItem, ...filtered].slice(0, 10), // Keep last 10
          }
        }),
      clearRecentItems: () => set({ recentItems: [] }),

      // Theme
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // Global loading
      globalLoading: false,
      setGlobalLoading: (loading) => set({ globalLoading: loading }),

      // Search focus
      searchFocused: false,
      setSearchFocused: (focused) => set({ searchFocused: focused }),

      // Filters panel
      filtersPanelOpen: false,
      setFiltersPanelOpen: (open) => set({ filtersPanelOpen: open }),
      toggleFiltersPanel: () =>
        set((state) => ({ filtersPanelOpen: !state.filtersPanelOpen })),
    }),
    {
      name: 'admincrew-ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        recentItems: state.recentItems,
        theme: state.theme,
      }),
    }
  )
)

// Selectors for better performance
export const useSidebarOpen = () => useUIStore((state) => state.sidebarOpen)
export const useSidebarCollapsed = () => useUIStore((state) => state.sidebarCollapsed)
export const useCommandPaletteOpen = () => useUIStore((state) => state.commandPaletteOpen)
export const useTheme = () => useUIStore((state) => state.theme)
export const useRecentItems = () => useUIStore((state) => state.recentItems)
export const useFiltersPanelOpen = () => useUIStore((state) => state.filtersPanelOpen)
