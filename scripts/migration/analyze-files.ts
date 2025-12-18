/**
 * Analyze storage files to see if we can match them to candidates
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const SOURCE_URL = process.env.SOURCE_SUPABASE_URL!
const SOURCE_KEY = process.env.SOURCE_SUPABASE_KEY!

const sourceClient = createClient(SOURCE_URL, SOURCE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function analyze() {
  console.log('\n========================================')
  console.log('  ANALYZING STORAGE FILES')
  console.log('========================================\n')

  // List files in candidate-cvs/uploads
  console.log('1. Files in candidate-cvs/uploads:')
  const { data: cvFiles, error: cvError } = await sourceClient.storage
    .from('candidate-cvs')
    .list('uploads', { limit: 100 })

  if (cvError) {
    console.log('  Error:', cvError.message)
  } else {
    const cvCount = cvFiles ? cvFiles.length : 0
    console.log('  Found ' + cvCount + ' files:\n')
    if (cvFiles) {
      cvFiles.slice(0, 10).forEach(f => {
        console.log('    - ' + f.name)
      })
      if (cvCount > 10) console.log('    ... and ' + (cvCount - 10) + ' more')
    }
  }

  // List files in candidate-certificates/uploads
  console.log('\n2. Files in candidate-certificates/uploads:')
  const { data: certFiles, error: certError } = await sourceClient.storage
    .from('candidate-certificates')
    .list('uploads', { limit: 100 })

  if (certError) {
    console.log('  Error:', certError.message)
  } else {
    const certCount = certFiles ? certFiles.length : 0
    console.log('  Found ' + certCount + ' files:\n')
    if (certFiles) {
      certFiles.slice(0, 10).forEach(f => {
        console.log('    - ' + f.name)
      })
      if (certCount > 10) console.log('    ... and ' + (certCount - 10) + ' more')
    }
  }

  // Get some candidate names to compare
  console.log('\n3. Sample candidate names from database:')
  const { data: candidates } = await sourceClient
    .from('candidates')
    .select('name, cv_key')
    .not('cv_key', 'is', null)
    .limit(10)

  if (candidates) {
    candidates.forEach(c => {
      console.log('    ' + c.name)
      console.log('      cv_key: ' + c.cv_key)
    })
  }

  // Try to find matches by name
  console.log('\n4. Attempting to match files to candidates by name...')
  if (cvFiles && candidates) {
    let matches = 0
    for (const candidate of candidates) {
      const nameParts: string[] = candidate.name.toLowerCase().split(' ')
      const matchingFile = cvFiles.find(f => {
        const fileName = f.name.toLowerCase().replace(/_/g, ' ')
        // Check if any significant name part appears in filename
        return nameParts.some((part: string) => part.length > 2 && fileName.includes(part))
      })
      if (matchingFile) {
        matches++
        console.log('    MATCH: ' + candidate.name + ' -> ' + matchingFile.name)
      }
    }
    console.log('\n  Found ' + matches + ' potential matches out of ' + candidates.length + ' candidates')
  }

  // Check root of buckets too
  console.log('\n5. Checking root of candidate-cvs bucket:')
  const { data: rootCvFiles } = await sourceClient.storage
    .from('candidate-cvs')
    .list('', { limit: 20 })

  if (rootCvFiles) {
    rootCvFiles.forEach(f => {
      console.log('    ' + (f.id ? '[folder]' : '[file]') + ' ' + f.name)
    })
  }

  console.log('\n6. Checking cv/ folder:')
  const { data: cvFolderFiles } = await sourceClient.storage
    .from('candidate-cvs')
    .list('cv', { limit: 20 })

  if (cvFolderFiles && cvFolderFiles.length > 0) {
    console.log('  Found ' + cvFolderFiles.length + ' files:')
    cvFolderFiles.slice(0, 5).forEach(f => {
      console.log('    - ' + f.name)
    })
  } else {
    console.log('  No files in cv/ folder')
  }
}

analyze().catch(console.error)
