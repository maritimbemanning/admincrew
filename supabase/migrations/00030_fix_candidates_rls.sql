-- Migration: Fix candidates RLS policies (SECURITY FIX)
-- Created: 2026-01-18
-- Issue: Migration 00029 opened candidates table to ALL authenticated users
-- Fix: Restore proper staff-only access control

-- ═══════════════════════════════════════════════════════════════════════════════
-- DROP BROKEN POLICIES FROM 00029
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Authenticated users can view candidates" ON public.candidates;
DROP POLICY IF EXISTS "Authenticated users can create candidates" ON public.candidates;
DROP POLICY IF EXISTS "Authenticated users can update candidates" ON public.candidates;
DROP POLICY IF EXISTS "Authenticated users can delete candidates" ON public.candidates;

-- ═══════════════════════════════════════════════════════════════════════════════
-- HELPER FUNCTION: Check if user is staff
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'admin', 'recruiter', 'coordinator', 'consultant')
  );
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PROPER RLS POLICIES FOR CANDIDATES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Staff can view all candidates
CREATE POLICY "Staff can view all candidates"
  ON public.candidates
  FOR SELECT
  TO authenticated
  USING (public.is_staff());

-- Staff can create candidates
CREATE POLICY "Staff can create candidates"
  ON public.candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff());

-- Staff can update candidates
CREATE POLICY "Staff can update candidates"
  ON public.candidates
  FOR UPDATE
  TO authenticated
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Staff can soft-delete candidates (archive)
CREATE POLICY "Staff can delete candidates"
  ON public.candidates
  FOR DELETE
  TO authenticated
  USING (public.is_staff());

-- Employees can view their own candidate profile (via user_id link)
CREATE POLICY "Employees can view own candidate profile"
  ON public.candidates
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFY RLS IS ENABLED
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- GRANT USAGE TO AUTHENTICATED ROLE
-- ═══════════════════════════════════════════════════════════════════════════════

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidates TO authenticated;
