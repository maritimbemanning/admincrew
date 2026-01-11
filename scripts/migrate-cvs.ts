// scripts/migrate-cvs.ts
// Migrate CVs from bluecrew storage to admincrew storage

import { createClient } from '@supabase/supabase-js'

// Bluecrew (source) - READ ONLY
const sourceUrl = 'https://uqwfesvsfiqjcpzwetkz.supabase.co'
const sourceKey = process.env.SOURCE_SUPABASE_KEY!

// Admincrew (destination)
const destUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const destKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const source = createClient(sourceUrl, sourceKey)
const dest = createClient(destUrl, destKey)

interface CandidateWithCV {
  id: string
  first_name: string
  last_name: string
  cv_file_path: string
  legacy_id: string | null
}

async function migrateCVs() {
  console.log('=== CV Migration Script ===\n')

  // 1. Get candidates with cv/{hash}.pdf paths (broken bluecrew paths)
  const { data: candidates, error } = await dest
    .from('candidates')
    .select('id, first_name, last_name, cv_file_path, legacy_id')
    .like('cv_file_path', 'cv/%')
    .not('cv_file_path', 'is', null)

  if (error) {
    console.error('Error fetching candidates:', error)
    return
  }

  console.log(`Found ${candidates?.length || 0} candidates with bluecrew CV paths\n`)

  if (!candidates || candidates.length === 0) {
    console.log('No CVs to migrate!')
    return
  }

  let migrated = 0
  let failed = 0
  let notFound = 0

  for (const candidate of candidates as CandidateWithCV[]) {
    const oldPath = candidate.cv_file_path
    const fileName = oldPath.split('/').pop() // e.g., "abc123.pdf"

    console.log(`\nProcessing: ${candidate.first_name} ${candidate.last_name}`)
    console.log(`  Old path: ${oldPath}`)

    try {
      // Try to download from bluecrew storage
      // The bucket might be 'cv', 'cvs', 'candidate-cvs', etc.
      const possibleBuckets = ['cv', 'cvs', 'candidate-cvs', 'uploads', 'documents']
      const possiblePaths = [
        fileName,
        `cv/${fileName}`,
        oldPath,
        `uploads/${fileName}`,
      ]

      let fileData: Blob | null = null
      let foundIn = ''

      // Try all bucket/path combinations
      for (const bucket of possibleBuckets) {
        if (fileData) break
        for (const path of possiblePaths) {
          const { data, error: downloadError } = await source.storage
            .from(bucket)
            .download(path)

          if (data && !downloadError) {
            fileData = data
            foundIn = `${bucket}/${path}`
            break
          }
        }
      }

      if (!fileData) {
        console.log(`  NOT FOUND in any bucket`)
        notFound++
        continue
      }

      console.log(`  Found in: ${foundIn}`)

      // Upload to admincrew
      const newPath = `migrated/${candidate.id}/${fileName}`

      const { error: uploadError } = await dest.storage
        .from('candidate-cvs')
        .upload(newPath, fileData, {
          contentType: 'application/pdf',
          upsert: true
        })

      if (uploadError) {
        console.log(`  Upload failed: ${uploadError.message}`)
        failed++
        continue
      }

      // Update database
      const { error: updateError } = await dest
        .from('candidates')
        .update({ cv_file_path: newPath })
        .eq('id', candidate.id)

      if (updateError) {
        console.log(`  DB update failed: ${updateError.message}`)
        failed++
        continue
      }

      console.log(`  Migrated to: ${newPath}`)
      migrated++

    } catch (err) {
      console.log(`  Error: ${err}`)
      failed++
    }
  }

  console.log('\n=== Migration Complete ===')
  console.log(`Migrated: ${migrated}`)
  console.log(`Not found: ${notFound}`)
  console.log(`Failed: ${failed}`)
}

// Run
migrateCVs().catch(console.error)
