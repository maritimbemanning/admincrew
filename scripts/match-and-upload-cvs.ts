/**
 * Match CVs from bluecrew export to candidates by name
 * Then upload and update database
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

// Extract name from filename like "1765497644094-2sws7q-CV_Anders_Alvseike_Oppdatert___1_.pdf"
function extractNameFromFilename(filename: string): string | null {
  // Remove timestamp prefix and extension
  const withoutExt = filename.replace(/\.(pdf|docx|doc)$/i, '')
  const parts = withoutExt.split('-')

  // Skip timestamp and random parts (first 2)
  if (parts.length < 3) return null

  const namePart = parts.slice(2).join('-')

  // Clean up the name
  return namePart
    .replace(/^CV[_\s-]*/i, '')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\(\d+\)/g, '')
    .replace(/oppdatert/gi, '')
    .replace(/norsk/gi, '')
    .replace(/english/gi, '')
    .trim()
    .toLowerCase()
}

// Normalize candidate name for matching
function normalizeName(first: string, last: string): string {
  return `${first} ${last}`.toLowerCase().trim()
}

async function matchAndUploadCvs(folderPath: string) {
  console.log('=== CV Matching & Upload Script ===\n')
  console.log('Source folder:', folderPath)

  // 1. Get candidates with broken cv/ paths
  const { data: candidates, error } = await supabase
    .from('candidates')
    .select('id, first_name, last_name, cv_file_path')
    .like('cv_file_path', 'cv/%')

  if (error) {
    console.error('Error fetching candidates:', error)
    return
  }

  console.log(`\nFound ${candidates?.length || 0} candidates with broken cv/ paths\n`)

  // 2. Get all files
  const allFiles = fs.readdirSync(folderPath)
  const cvFiles = allFiles.filter(f => {
    const ext = path.extname(f).toLowerCase()
    return VALID_EXTENSIONS.includes(ext)
  })

  console.log(`Found ${cvFiles.length} CV files in folder\n`)

  // 3. Build name -> file map
  const filesByName: Map<string, string[]> = new Map()
  for (const file of cvFiles) {
    const extractedName = extractNameFromFilename(file)
    if (extractedName) {
      const existing = filesByName.get(extractedName) || []
      existing.push(file)
      filesByName.set(extractedName, existing)
    }
  }

  console.log('Extracted names from files:')
  for (const [name, files] of filesByName.entries()) {
    if (files.length > 0) {
      console.log(`  "${name}" -> ${files.length} file(s)`)
    }
  }
  console.log()

  // 4. Try to match candidates
  let matched = 0
  let uploaded = 0
  let failed = 0
  const matches: Array<{ candidate: any; file: string; extractedName: string }> = []

  for (const candidate of candidates || []) {
    const candidateName = normalizeName(candidate.first_name || '', candidate.last_name || '')

    // Try exact match first
    let matchedFiles = filesByName.get(candidateName)

    // Try partial match
    if (!matchedFiles) {
      for (const [extractedName, files] of filesByName.entries()) {
        if (
          extractedName.includes(candidateName) ||
          candidateName.includes(extractedName) ||
          // Match last name only
          extractedName.includes((candidate.last_name || '').toLowerCase()) ||
          // Match first name only (if unique enough)
          (candidate.first_name?.length > 4 && extractedName.includes((candidate.first_name || '').toLowerCase()))
        ) {
          matchedFiles = files
          break
        }
      }
    }

    if (matchedFiles && matchedFiles.length > 0) {
      // Use the most recent file (highest timestamp)
      const file = matchedFiles.sort().reverse()[0]
      matches.push({ candidate, file, extractedName: candidateName })
      matched++
    }
  }

  console.log(`\n=== Matches Found: ${matched} ===\n`)

  // 5. Upload matched files
  for (const { candidate, file } of matches) {
    const filePath = path.join(folderPath, file)
    const stats = fs.statSync(filePath)

    if (stats.size > MAX_FILE_SIZE) {
      console.log(`SKIP (too large): ${candidate.first_name} ${candidate.last_name}`)
      continue
    }

    const ext = path.extname(file).toLowerCase()
    const storagePath = `matched/${candidate.id}/cv${ext}`
    const contentType = ext === '.pdf' ? 'application/pdf'
      : ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/msword'

    try {
      const fileBuffer = fs.readFileSync(filePath)

      const { error: uploadError } = await supabase.storage
        .from('candidate-cvs')
        .upload(storagePath, fileBuffer, {
          contentType,
          upsert: true
        })

      if (uploadError) {
        console.error(`Upload failed for ${candidate.first_name} ${candidate.last_name}:`, uploadError.message)
        failed++
        continue
      }

      // Update database
      const { error: updateError } = await supabase
        .from('candidates')
        .update({ cv_file_path: storagePath })
        .eq('id', candidate.id)

      if (updateError) {
        console.error(`DB update failed for ${candidate.first_name} ${candidate.last_name}:`, updateError.message)
        failed++
        continue
      }

      console.log(`✓ ${candidate.first_name} ${candidate.last_name} -> ${storagePath}`)
      uploaded++
    } catch (err) {
      console.error(`Error processing ${candidate.first_name} ${candidate.last_name}:`, err)
      failed++
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Candidates with broken paths: ${candidates?.length || 0}`)
  console.log(`Matched by name: ${matched}`)
  console.log(`Uploaded: ${uploaded}`)
  console.log(`Failed: ${failed}`)
  console.log(`Still unmatched: ${(candidates?.length || 0) - matched}`)
}

// Get folder path from args
const folderPath = process.argv[2] || 'C:\\Users\\isakd\\Downloads\\uploads_extracted\\uploads'
matchAndUploadCvs(folderPath)
