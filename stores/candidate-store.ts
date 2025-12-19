import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CandidateFilters {
  search: string
  availability: string[]
  compliance: string[]
  skills: string[]
  certifications: string[]
  minRating: number | null
  maxHourlyRate: number | null
  locations: string[]
  poolId: string | null
}

export interface CandidateStoreState {
  // Filters
  filters: CandidateFilters
  setFilters: (filters: Partial<CandidateFilters>) => void
  resetFilters: () => void

  // View state
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void

  // Selection
  selectedCandidates: string[]
  toggleCandidateSelection: (id: string) => void
  selectAllCandidates: (ids: string[]) => void
  clearCandidateSelection: () => void

  // Bulk actions
  isBulkActionOpen: boolean
  setBulkActionOpen: (open: boolean) => void

  // Pool management
  activePoolId: string | null
  setActivePoolId: (id: string | null) => void

  // Comparison
  compareCandidates: string[]
  addToCompare: (id: string) => void
  removeFromCompare: (id: string) => void
  clearCompare: () => void
}

const defaultFilters: CandidateFilters = {
  search: '',
  availability: [],
  compliance: [],
  skills: [],
  certifications: [],
  minRating: null,
  maxHourlyRate: null,
  locations: [],
  poolId: null,
}

export const useCandidateStore = create<CandidateStoreState>()(
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
      viewMode: 'grid',
      setViewMode: (mode) => set({ viewMode: mode }),

      // Selection
      selectedCandidates: [],
      toggleCandidateSelection: (id) =>
        set((state) => ({
          selectedCandidates: state.selectedCandidates.includes(id)
            ? state.selectedCandidates.filter((cid) => cid !== id)
            : [...state.selectedCandidates, id],
        })),
      selectAllCandidates: (ids) => set({ selectedCandidates: ids }),
      clearCandidateSelection: () => set({ selectedCandidates: [] }),

      // Bulk actions
      isBulkActionOpen: false,
      setBulkActionOpen: (open) => set({ isBulkActionOpen: open }),

      // Pool management
      activePoolId: null,
      setActivePoolId: (id) =>
        set((state) => ({
          activePoolId: id,
          filters: { ...state.filters, poolId: id },
        })),

      // Comparison
      compareCandidates: [],
      addToCompare: (id) =>
        set((state) => {
          if (state.compareCandidates.length >= 4) return state
          if (state.compareCandidates.includes(id)) return state
          return { compareCandidates: [...state.compareCandidates, id] }
        }),
      removeFromCompare: (id) =>
        set((state) => ({
          compareCandidates: state.compareCandidates.filter((cid) => cid !== id),
        })),
      clearCompare: () => set({ compareCandidates: [] }),
    }),
    {
      name: 'candidate-store',
      partialize: (state) => ({
        viewMode: state.viewMode,
        activePoolId: state.activePoolId,
      }),
    }
  )
)
