-- Migration: Add RLS policies for candidates table
-- Created: 2025-12-19
-- Note: This migration was applied directly to Supabase to fix missing RLS policies
-- that prevented candidates from being displayed on /candidates page

-- Policy for SELECT - allow authenticated users to view all candidates
CREATE POLICY "Authenticated users can view candidates"
  ON public.candidates
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for INSERT - allow authenticated users to create candidates
CREATE POLICY "Authenticated users can create candidates"
  ON public.candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy for UPDATE - allow authenticated users to update candidates
CREATE POLICY "Authenticated users can update candidates"
  ON public.candidates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for DELETE - allow authenticated users to delete candidates
CREATE POLICY "Authenticated users can delete candidates"
  ON public.candidates
  FOR DELETE
  TO authenticated
  USING (true);
