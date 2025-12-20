// hooks/use-job-applications.ts
// Hook for å hente og håndtere jobbsøknader fra bluecrew.no

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { JobApplication, JobApplicationStatus } from '@/types/portal'

interface UseJobApplicationsOptions {
  status?: JobApplicationStatus
  jobPostingId?: string
  search?: string
  limit?: number
}

export function useJobApplications(options: UseJobApplicationsOptions = {}) {
  const { status, jobPostingId, search, limit = 50 } = options
  const supabase = createClient()

  return useQuery({
    queryKey: ['job-applications', { status, jobPostingId, search, limit }],
    queryFn: async () => {
      let query = supabase
        .from('job_applications')
        .select(`
          *,
          job_posting:job_postings(id, title, slug, company_name, category)
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (status) {
        query = query.eq('status', status)
      }

      if (jobPostingId) {
        query = query.eq('job_posting_id', jobPostingId)
      }

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      return data as JobApplication[]
    },
  })
}

export function useJobApplication(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['job-application', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job_posting:job_postings(id, title, slug, company_name, category, location, description)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as JobApplication
    },
    enabled: !!id,
  })
}

export function useUpdateJobApplicationStatus() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: JobApplicationStatus }) => {
      const { data, error } = await supabase
        .from('job_applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] })
    },
  })
}

export function useConvertApplicationToCandidate() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (application: JobApplication) => {
      // 1. Sjekk om kandidat allerede finnes med denne e-posten
      const { data: existing } = await supabase
        .from('candidates')
        .select('id')
        .eq('email', application.email.toLowerCase())
        .single()

      if (existing) {
        // Oppdater eksisterende kandidat med søknad-referanse
        await supabase
          .from('job_applications')
          .update({ 
            candidate_id: existing.id, 
            status: 'converted',
            updated_at: new Date().toISOString()
          })
          .eq('id', application.id)

        return { candidateId: existing.id, created: false }
      }

      // 2. Opprett ny kandidat
      const nameParts = application.name.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      const { data: newCandidate, error: insertError } = await supabase
        .from('candidates')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: application.email.toLowerCase(),
          phone: application.phone || application.vipps_phone,
          status: 'active',
          availability_status: 'available',
          compliance_status: 'not_started',
          source: 'job_application',
          source_details: {
            job_posting_id: application.job_posting_id,
            job_title: application.job_posting?.title,
            application_id: application.id,
            vipps_verified: application.vipps_verified,
          },
          cv_file_path: application.cv_key,
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      // 3. Oppdater søknaden med kandidat-ID
      await supabase
        .from('job_applications')
        .update({ 
          candidate_id: newCandidate.id, 
          status: 'converted',
          updated_at: new Date().toISOString()
        })
        .eq('id', application.id)

      return { candidateId: newCandidate.id, created: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-applications'] })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
  })
}

export function useJobApplicationStats() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['job-applications-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('job_applications')
        .select('status')

      if (error) throw error

      // NB: DB bruker 'pending' som default, ikke 'new'!
      const stats = {
        total: data.length,
        pending: data.filter(a => a.status === 'pending').length,
        reviewed: data.filter(a => a.status === 'reviewed').length,
        shortlisted: data.filter(a => a.status === 'shortlisted').length,
        hired: data.filter(a => a.status === 'hired').length,
        rejected: data.filter(a => a.status === 'rejected').length,
      }

      return stats
    },
  })
}
