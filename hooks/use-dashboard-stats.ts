'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface DashboardStats {
  availableCandidates: number
  openRequests: number
  urgentRequests: number
  activeAssignments: number
  startingThisWeek: number
  pendingApprovals: number
  compliancePending: number
  expiringCertificates: number
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUERY KEYS
// ═══════════════════════════════════════════════════════════════════════════════

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  recentActivity: () => [...dashboardKeys.all, 'recent-activity'] as const,
}

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD STATS HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useDashboardStats() {
  const supabase = createClient()

  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async (): Promise<DashboardStats> => {
      const today = new Date().toISOString().split('T')[0]
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Execute all queries in parallel
      const [
        candidatesResult,
        requestsResult,
        assignmentsResult,
        complianceResult,
        timesheetsResult,
        certificatesResult,
      ] = await Promise.all([
        // Available candidates count
        supabase
          .from('candidates')
          .select('*', { count: 'exact', head: true })
          .in('availability_status', ['available', 'available_soon'])
          .is('archived_at', null),

        // Open requests with priority
        supabase
          .from('customer_requests')
          .select('id, priority')
          .not('status', 'in', '("converted","cancelled","expired")'),

        // Assignments with status and start date
        supabase
          .from('assignments')
          .select('id, status, planned_start_date')
          .in('status', ['contract_signed', 'ready_for_start', 'active']),

        // Compliance pending count
        supabase
          .from('candidates')
          .select('*', { count: 'exact', head: true })
          .in('compliance_status', ['documents_pending', 'review_pending'])
          .is('archived_at', null),

        // Pending timesheet approvals
        supabase
          .from('assignment_timesheets')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'submitted'),

        // Expiring certificates (next 30 days)
        supabase
          .from('candidate_certifications')
          .select('*', { count: 'exact', head: true })
          .lte('expiry_date', thirtyDaysFromNow)
          .gte('expiry_date', today)
          .eq('status', 'active'),
      ])

      // Process request data
      const requestData = requestsResult.data
      const openRequests = requestData?.length || 0
      const urgentRequests = requestData?.filter(r => r.priority === 'urgent').length || 0

      // Process assignment data
      const assignmentData = assignmentsResult.data
      const activeAssignments = assignmentData?.filter(a => a.status === 'active').length || 0
      const startingThisWeek = assignmentData?.filter(a =>
        a.planned_start_date &&
        a.planned_start_date >= today &&
        a.planned_start_date <= weekFromNow
      ).length || 0

      return {
        availableCandidates: candidatesResult.count || 0,
        openRequests,
        urgentRequests,
        activeAssignments,
        startingThisWeek,
        pendingApprovals: timesheetsResult.count || 0,
        compliancePending: complianceResult.count || 0,
        expiringCertificates: certificatesResult.count || 0,
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECENT ACTIVITY HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export interface RecentActivity {
  id: string
  type: 'assignment_started' | 'contract_signed' | 'request_created' | 'candidate_created'
  title: string
  subtitle?: string
  timestamp: string
}

// Types for Supabase query results with relations
interface AssignmentWithRelations {
  id: string
  title: string
  status: string
  created_at: string
  candidate: { first_name: string; last_name: string } | null
  organization: { name: string } | null
}

interface RequestWithRelations {
  id: string
  title: string
  request_number: string
  created_at: string
  organization: { name: string } | null
}

export function useRecentActivity() {
  const supabase = createClient()

  return useQuery({
    queryKey: dashboardKeys.recentActivity(),
    queryFn: async (): Promise<RecentActivity[]> => {
      const activities: RecentActivity[] = []

      // Recent assignments that started
      const { data: recentAssignments } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          status,
          created_at,
          candidate:candidates(first_name, last_name),
          organization:crm_contacts(name)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3)

      const assignments = recentAssignments as AssignmentWithRelations[] | null
      assignments?.forEach(a => {
        activities.push({
          id: `assignment-${a.id}`,
          type: 'assignment_started',
          title: a.candidate ? `${a.candidate.first_name} ${a.candidate.last_name}` : 'Kandidat',
          subtitle: a.organization?.name ? `startet oppdrag hos ${a.organization.name}` : 'startet oppdrag',
          timestamp: a.created_at,
        })
      })

      // Recent requests
      const { data: recentRequests } = await supabase
        .from('customer_requests')
        .select(`
          id,
          title,
          request_number,
          created_at,
          organization:crm_contacts(name)
        `)
        .order('created_at', { ascending: false })
        .limit(3)

      const requests = recentRequests as RequestWithRelations[] | null
      requests?.forEach(r => {
        activities.push({
          id: `request-${r.id}`,
          type: 'request_created',
          title: 'Ny request',
          subtitle: r.organization?.name ? `fra ${r.organization.name}` : r.title,
          timestamp: r.created_at,
        })
      })

      // Sort by timestamp and take top 5
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5)
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}
