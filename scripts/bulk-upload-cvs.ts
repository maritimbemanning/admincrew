/**
 * Bulk upload all CVs to storage in legacy/ folder
 * Then clear broken cv_file_path values
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const VALID_EXTENSIONS = ['.pdf', '.docx', '.doc']
const SKIP_PATTERNS = [
  /bluecrew.*iso/i,
  /bluecrew.*quality/i,
  /bluecrew.*tjeneste/i,
  /flensekurs/i,
  /fulllogo/i,
  /icononly/i,
  /\.jpg$/i,
  /\.png$/i,
  /\.jpeg$/i,
]

async function bulkUpload(folderPath: string) {
  console.log('=== Bulk CV Upload ===\n')

  const allFiles = fs.readdirSync(folderPath)

  // Filter to CV files only
  const cvFiles = allFiles.filter(f => {
    const ext = path.extname(f).toLowerCase()
    if (!VALID_EXTENSIONS.includes(ext)) return false

    // Skip non-CV files
    for (const pattern of SKIP_PATTERNS) {
      if (pattern.test(f)) {
        console.log(`SKIP (not a CV): ${f}`)
        return false
      }
    }
    return true
  })

  console.log(`\nFound ${cvFiles.length} CV files to upload\n`)

  let uploaded = 0
  let skipped = 0
  let failed = 0

  for (const file of cvFiles) {
    const filePath = path.join(folderPath, file)
    const stats = fs.statSync(filePath)

    if (stats.size > MAX_FILE_SIZE) {
      console.log(`SKIP (>10MB): ${file}`)
      skipped++
      continue
    }

    const ext = path.extname(file).toLowerCase()
    const storagePath = `legacy/${file}`
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
        console.error(`FAIL: ${file} - ${error.message}`)
        failed++
      } else {
        console.log(`✓ ${file}`)
        uploaded++
      }
    } catch (err) {
      console.error(`ERROR: ${file}`, err)
      failed++
    }
  }

  console.log('\n=== Upload Complete ===')
  console.log(`Uploaded: ${uploaded}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Failed: ${failed}`)

  // Now clear broken paths
  console.log('\n=== Clearing broken cv/ paths ===')
  const { data, error } = await supabase
    .from('candidates')
    .update({ cv_file_path: null })
    .like('cv_file_path', 'cv/%')
    .select('id, first_name, last_name')

  if (error) {
    console.error('Error clearing paths:', error)
  } else {
    console.log(`Cleared ${data?.length || 0} broken paths`)
  }

  console.log('\n✅ Done! CVs are now in storage/candidate-cvs/legacy/')
  console.log('   Assign them to candidates manually in the UI')
}

const folderPath = process.argv[2] || 'C:\\Users\\isakd\\Downloads\\uploads_extracted\\uploads'
bulkUpload(folderPath)
