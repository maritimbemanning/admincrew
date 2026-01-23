import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface OperationsFilters {
  search: string
  status: string[]
  priority: string[]
  clientId: string | null
  assignedTo: string | null
  dateFrom: Date | null
  dateTo: Date | null
}

export interface OperationsStoreState {
  // Filters
  filters: OperationsFilters
  setFilters: (filters: Partial<OperationsFilters>) => void
  resetFilters: () => void

  // View state
  viewMode: 'kanban' | 'list'
  setViewMode: (mode: 'kanban' | 'list') => void

  // Active request
  activeRequestId: string | null
  setActiveRequestId: (id: string | null) => void

  // Shortlist
  shortlistOpen: boolean
  setShortlistOpen: (open: boolean) => void
  shortlistRequestId: string | null
  setShortlistRequestId: (id: string | null) => void

  // Matching panel
  matchingPanelOpen: boolean
  setMatchingPanelOpen: (open: boolean) => void
  matchingRequestId: string | null
  setMatchingRequestId: (id: string | null) => void

  // Quick actions
  quickActionDialogOpen: boolean
  setQuickActionDialogOpen: (open: boolean) => void
  quickActionType: 'status' | 'assignment' | 'notes' | null
  setQuickActionType: (type: 'status' | 'assignment' | 'notes' | null) => void

  // Kanban
  kanbanColumns: string[]
  setKanbanColumns: (columns: string[]) => void
  collapsedColumns: string[]
  toggleColumnCollapse: (column: string) => void
}

const defaultFilters: OperationsFilters = {
  search: '',
  status: [],
  priority: [],
  clientId: null,
  assignedTo: null,
  dateFrom: null,
  dateTo: null,
}

const defaultKanbanColumns = [
  'draft',
  'pending_approval',
  'matching',
  'shortlisted',
  'offer_sent',
  'converted',
]

export const useOperationsStore = create<OperationsStoreState>()(
  persist(
    (set) => ({
      // Filters
      filters: defaultFilters,
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),
      resetFilters: () => set({ filters: defaultFilters }),

      // View state
      viewMode: 'kanban',
      setViewMode: (mode) => set({ viewMode: mode }),

      // Active request
      activeRequestId: null,
      setActiveRequestId: (id) => set({ activeRequestId: id }),

      // Shortlist
      shortlistOpen: false,
      setShortlistOpen: (open) => set({ shortlistOpen: open }),
      shortlistRequestId: null,
      setShortlistRequestId: (id) =>
        set({ shortlistRequestId: id, shortlistOpen: !!id }),

      // Matching panel
      matchingPanelOpen: false,
      setMatchingPanelOpen: (open) => set({ matchingPanelOpen: open }),
      matchingRequestId: null,
      setMatchingRequestId: (id) =>
        set({ matchingRequestId: id, matchingPanelOpen: !!id }),

      // Quick actions
      quickActionDialogOpen: false,
      setQuickActionDialogOpen: (open) => set({ quickActionDialogOpen: open }),
      quickActionType: null,
      setQuickActionType: (type) => set({ quickActionType: type }),

      // Kanban
      kanbanColumns: defaultKanbanColumns,
      setKanbanColumns: (columns) => set({ kanbanColumns: columns }),
      collapsedColumns: [],
      toggleColumnCollapse: (column) =>
        set((state) => ({
          collapsedColumns: state.collapsedColumns.includes(column)
            ? state.collapsedColumns.filter((c) => c !== column)
            : [...state.collapsedColumns, column],
        })),
    }),
    {
      name: 'operations-store',
      partialize: (state) => ({
        viewMode: state.viewMode,
        kanbanColumns: state.kanbanColumns,
        collapsedColumns: state.collapsedColumns,
      }),
    }
  )
)
