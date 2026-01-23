'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type {
  Timesheet,
  TimesheetFilters,
  CreateTimesheetInput,
  UpdateTimesheetInput,
  TimesheetStatus,
  TimesheetEntry,
} from '@/types/contracts'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const timesheetKeys = {
  all: ['timesheets'] as const,
  lists: () => [...timesheetKeys.all, 'list'] as const,
  list: (filters: TimesheetFilters) => [...timesheetKeys.lists(), filters] as const,
  details: () => [...timesheetKeys.all, 'detail'] as const,
  detail: (id: string) => [...timesheetKeys.details(), id] as const,
  approval: () => [...timesheetKeys.all, 'approval'] as const,
}

// ============================================================================
// TIMESHEET LIST HOOK
// ============================================================================

interface UseTimesheetsOptions {
  filters?: TimesheetFilters
  page?: number
  pageSize?: number
}

export function useTimesheets(options: UseTimesheetsOptions = {}) {
  const { filters = {}, page = 1, pageSize = 20 } = options
  const supabase = createClient()

  return useQuery({
    queryKey: timesheetKeys.list({ ...filters, page, pageSize } as TimesheetFilters),
    queryFn: async () => {
      let query = supabase
        .from('assignment_timesheets')
        .select(
          `
          *,
          assignment:assignments(
            id,
            assignment_number,
            title,
            role,
            employee_rate_amount_nok,
            billing_rate_amount_nok,
            candidate:candidates(id, first_name, last_name),
            organization:crm_organizations(id, name)
          )
        `,
          { count: 'exact' }
        )
        .order('period_start', { ascending: false })

      // Apply filters
      if (filters.assignment_id) {
        query = query.eq('assignment_id', filters.assignment_id)
      }

      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status)
      }

      if (filters.period_from) {
        query = query.gte('period_start', filters.period_from)
      }

      if (filters.period_to) {
        query = query.lte('period_end', filters.period_to)
      }

      // Pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      return {
        timesheets: data as Timesheet[],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      }
    },
  })
}

// ============================================================================
// SINGLE TIMESHEET HOOK
// ============================================================================

export function useTimesheet(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: timesheetKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignment_timesheets')
        .select(
          `
          *,
          assignment:assignments(
            id,
            assignment_number,
            title,
            role,
            employee_rate_amount_nok,
            billing_rate_amount_nok,
            candidate:candidates(id, first_name, last_name),
            organization:crm_organizations(id, name)
          )
        `
        )
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Timesheet
    },
    enabled: !!id,
  })
}

// ============================================================================
// APPROVAL QUEUE HOOK
// ============================================================================

export function useTimesheetApprovalQueue() {
  const supabase = createClient()

  return useQuery({
    queryKey: timesheetKeys.approval(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignment_timesheets')
        .select(
          `
          *,
          assignment:assignments(
            id,
            assignment_number,
            title,
            role,
            employee_rate_amount_nok,
            billing_rate_amount_nok,
            candidate:candidates(id, first_name, last_name),
            organization:crm_organizations(id, name)
          )
        `
        )
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: true })

      if (error) throw error
      return data as Timesheet[]
    },
  })
}

// ============================================================================
// TIMESHEET MUTATIONS
// ============================================================================

export function useCreateTimesheet() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (input: CreateTimesheetInput) => {
      const { data, error } = await supabase
        .from('assignment_timesheets')
        .insert({
          ...input,
          entries: input.entries || [],
          total_hours: 0,
          total_days: 0,
          status: 'draft',
        })
        .select()
        .single()

      if (error) throw error
      return data as Timesheet
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timesheetKeys.all })
    },
  })
}

export function useUpdateTimesheet() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, entries }: { id: string; entries: TimesheetEntry[] }) => {
      // Calculate totals
      const totalHours = entries.reduce((sum, e) => sum + e.hours, 0)
      const totalDays = totalHours / 8 // Assuming 8-hour workday

      const { data, error } = await supabase
        .from('assignment_timesheets')
        .update({
          entries,
          total_hours: totalHours,
          total_days: totalDays,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Timesheet
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: timesheetKeys.all })
      queryClient.invalidateQueries({ queryKey: timesheetKeys.detail(data.id) })
    },
  })
}

export function useSubmitTimesheet() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('assignment_timesheets')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          submitted_by: user?.id || null,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Timesheet
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: timesheetKeys.all })
      queryClient.invalidateQueries({ queryKey: timesheetKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: timesheetKeys.approval() })
    },
  })
}

export function useApproveTimesheet() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Get timesheet with assignment rates
      const { data: timesheet, error: fetchError } = await supabase
        .from('assignment_timesheets')
        .select(
          `
          *,
          assignment:assignments(employee_rate_amount_nok, billing_rate_amount_nok)
        `
        )
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // Calculate costs
      const employeeRate = timesheet.assignment?.employee_rate_amount_nok || 0
      const billingRate = timesheet.assignment?.billing_rate_amount_nok || 0
      const calculatedCost = timesheet.total_days * employeeRate
      const calculatedBilling = timesheet.total_days * billingRate

      const { data, error } = await supabase
        .from('assignment_timesheets')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id || null,
          calculated_cost_nok: calculatedCost,
          calculated_billing_nok: calculatedBilling,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Timesheet
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: timesheetKeys.all })
      queryClient.invalidateQueries({ queryKey: timesheetKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: timesheetKeys.approval() })
    },
  })
}

export function useRejectTimesheet() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('assignment_timesheets')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_by: user?.id || null,
          rejection_reason: reason,
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Timesheet
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: timesheetKeys.all })
      queryClient.invalidateQueries({ queryKey: timesheetKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: timesheetKeys.approval() })
    },
  })
}

export function useDeleteTimesheet() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('assignment_timesheets')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timesheetKeys.all })
    },
  })
}

// ============================================================================
// HELPER: Get timesheets for assignment
// ============================================================================

export function useAssignmentTimesheets(assignmentId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: [...timesheetKeys.all, 'assignment', assignmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assignment_timesheets')
        .select('*')
        .eq('assignment_id', assignmentId)
        .order('period_start', { ascending: false })

      if (error) throw error
      return data as Timesheet[]
    },
    enabled: !!assignmentId,
  })
}

// ============================================================================
// HELPER: Calculate period dates
// ============================================================================

export function getWeekPeriod(date: Date = new Date()): { start: string; end: string } {
  const d = new Date(date)
  const day = d.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day

  const monday = new Date(d)
  monday.setDate(d.getDate() + diffToMonday)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  }
}

export function getMonthPeriod(date: Date = new Date()): { start: string; end: string } {
  const year = date.getFullYear()
  const month = date.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  return {
    start: firstDay.toISOString().split('T')[0],
    end: lastDay.toISOString().split('T')[0],
  }
}
