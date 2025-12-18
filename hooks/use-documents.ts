'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { TablesInsert, DocumentType } from '@/types/database.types'
import { candidateKeys } from './use-candidates'

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

interface UploadDocumentParams {
  candidateId: string
  file: File
  type: DocumentType
  name: string
  description?: string
  issueDate?: string
  expiryDate?: string
  documentNumber?: string
}

interface DeleteDocumentParams {
  id: string
  candidateId: string
  filePath: string
}

// ═══════════════════════════════════════════════════════
// UPLOAD DOCUMENT
// ═══════════════════════════════════════════════════════

export function useUploadDocument() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      candidateId,
      file,
      type,
      name,
      description,
      issueDate,
      expiryDate,
      documentNumber,
    }: UploadDocumentParams) => {
      // Generate unique file path
      const fileExtension = file.name.split('.').pop()
      const timestamp = Date.now()
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const filePath = `candidates/${candidateId}/documents/${timestamp}_${sanitizedFileName}`

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('candidate-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw new Error(`Kunne ikke laste opp fil: ${uploadError.message}`)
      }

      // Create document record in database
      const documentData: TablesInsert<'candidate_documents'> = {
        candidate_id: candidateId,
        type,
        name,
        description: description || null,
        file_path: filePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || null,
        issue_date: issueDate || null,
        expiry_date: expiryDate || null,
        document_number: documentNumber || null,
      }

      const { data, error } = await supabase
        .from('candidate_documents')
        .insert(documentData)
        .select()
        .single()

      if (error) {
        // Try to clean up uploaded file if database insert fails
        await supabase.storage.from('candidate-documents').remove([filePath])
        console.error('Database insert error:', error)
        throw new Error(`Kunne ikke lagre dokument: ${error.message}`)
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(data.candidate_id) })
    },
  })
}

// ═══════════════════════════════════════════════════════
// DELETE DOCUMENT
// ═══════════════════════════════════════════════════════

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, candidateId, filePath }: DeleteDocumentParams) => {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('candidate-documents')
        .remove([filePath])

      if (storageError) {
        console.error('Storage delete error:', storageError)
        // Continue anyway - file might already be deleted
      }

      // Delete from database
      const { error } = await supabase
        .from('candidate_documents')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Database delete error:', error)
        throw new Error(`Kunne ikke slette dokument: ${error.message}`)
      }

      return { candidateId }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: candidateKeys.detail(result.candidateId) })
    },
  })
}

// ═══════════════════════════════════════════════════════
// GET DOCUMENT URL
// ═══════════════════════════════════════════════════════

export function useGetDocumentUrl() {
  const supabase = createClient()

  return async (filePath: string): Promise<string | null> => {
    const { data } = await supabase.storage
      .from('candidate-documents')
      .createSignedUrl(filePath, 3600) // 1 hour expiry

    return data?.signedUrl || null
  }
}
