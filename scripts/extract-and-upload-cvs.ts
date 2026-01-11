/**
 * Extract CVs from zip and upload to Supabase storage
 *
 * Usage:
 *   1. Download the zip from Supabase (uploaded/uploads.zip)
 *   2. Extract it locally
 *   3. Run: npx tsx scripts/extract-and-upload-cvs.ts ./path/to/extracted/cv
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const VALID_EXTENSIONS = ['.pdf', '.docx', '.doc']

async function uploadCvs(folderPath: string) {
  console.log('Uploading CVs from:', folderPath)
  console.log(`Max file size: ${MAX_FILE_SIZE / 1024 / 1024} MB`)
  console.log(`Valid extensions: ${VALID_EXTENSIONS.join(', ')}\n`)

  // Get all valid CV files (no images!)
  const allFiles = fs.readdirSync(folderPath)
  const files = allFiles.filter(f => {
    const ext = path.extname(f).toLowerCase()
    return VALID_EXTENSIONS.includes(ext)
  })

  const skipped = allFiles.length - files.length
  console.log(`Found ${files.length} CV files (skipped ${skipped} non-CV files)`)

  let uploaded = 0
  let failed = 0

  let tooLarge = 0

  for (const file of files) {
    const filePath = path.join(folderPath, file)
    const stats = fs.statSync(filePath)

    // Skip files over 10 MB
    if (stats.size > MAX_FILE_SIZE) {
      console.warn(`SKIPPED (too large: ${(stats.size / 1024 / 1024).toFixed(1)} MB): ${file}`)
      tooLarge++
      continue
    }

    const ext = path.extname(file).toLowerCase()
    const storagePath = `cv/${file}` // matches cv/{hash}.pdf format
    const contentType = ext === '.pdf' ? 'application/pdf'
      : ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/msword'

    try {
      const fileBuffer = fs.readFileSync(filePath)

      const { error } = await supabase.storage
        .from('candidate-cvs')
        .upload(storagePath, fileBuffer, {
          contentType,
          upsert: true
        })

      if (error) {
        console.error(`Failed ${file}:`, error.message)
        failed++
      } else {
        console.log(`Uploaded: ${storagePath}`)
        uploaded++
      }
    } catch (err) {
      console.error(`Error ${file}:`, err)
      failed++
    }
  }

  console.log(`\n=== Done ===`)
  console.log(`Uploaded: ${uploaded}`)
  console.log(`Failed: ${failed}`)
  console.log(`Too large (>10MB): ${tooLarge}`)
}

// Get folder path from args
const folderPath = process.argv[2]
if (!folderPath) {
  console.log('Usage: npx tsx scripts/extract-and-upload-cvs.ts ./path/to/cv/folder')
  process.exit(1)
}

uploadCvs(folderPath)
