// scripts/migration/sync-remaining.ts
// Synk de siste kandidatene som mangler + sjekk data-kvalitet

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

const SOURCE_URL = process.env.SOURCE_SUPABASE_URL!
const SOURCE_KEY = process.env.SOURCE_SUPABASE_KEY!
const TARGET_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const TARGET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function syncRemaining() {
  console.log('🔄 SYNC REMAINING CANDIDATES')
  console.log('=====================================\n')

  const sourceClient = createClient(SOURCE_URL, SOURCE_KEY)
  const targetClient = createClient(TARGET_URL, TARGET_KEY)

  // 1. Hent alle kandidat-IDer fra begge sider
  console.log('📊 Sammenligner databaser...')
  
  const { data: sourceIds } = await sourceClient
    .from('candidates')
    .select('id, email, name, created_at')
    .order('created_at', { ascending: false })

  const { data: targetCandidates } = await targetClient
    .from('candidates')
    .select('id, email, legacy_id, first_name, last_name')

  if (!sourceIds || !targetCandidates) {
    console.log('❌ Kunne ikke hente data')
    return
  }

  console.log(`  Source: ${sourceIds.length} kandidater`)
  console.log(`  Target: ${targetCandidates.length} kandidater`)

  // Finn hvilke som mangler (basert på legacy_id)
  const targetLegacyIds = new Set(targetCandidates.map(c => c.legacy_id))
  const targetEmails = new Set(targetCandidates.map(c => c.email?.toLowerCase()))
  
  const missing = sourceIds.filter(s => 
    !targetLegacyIds.has(s.id) && !targetEmails.has(s.email?.toLowerCase())
  )

  console.log(`\n📋 Manglende kandidater: ${missing.length}`)
  
  if (missing.length === 0) {
    console.log('✅ Alle kandidater er allerede synkronisert!')
  } else {
    missing.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.name || 'Ukjent'} - ${m.email || 'ingen email'}`)
    })
  }

  // 2. Sjekk for duplikater i target
  console.log('\n📊 Sjekker for duplikater...')
  const emailCounts: Record<string, number> = {}
  targetCandidates.forEach(c => {
    const email = c.email?.toLowerCase() || ''
    emailCounts[email] = (emailCounts[email] || 0) + 1
  })
  
  const duplicates = Object.entries(emailCounts).filter(([_, count]) => count > 1)
  
  if (duplicates.length === 0) {
    console.log('  ✅ Ingen duplikater funnet')
  } else {
    console.log(`  ⚠️  ${duplicates.length} duplikater:`)
    duplicates.forEach(([email, count]) => {
      console.log(`     - ${email}: ${count} forekomster`)
    })
  }

  // 3. Sjekk data-kvalitet
  console.log('\n📊 Data-kvalitet:')
  
  const { data: qualityCheck } = await targetClient
    .from('candidates')
    .select('id, first_name, last_name, email, primary_role, availability_status, compliance_status')

  if (qualityCheck) {
    const noEmail = qualityCheck.filter(c => !c.email).length
    const noRole = qualityCheck.filter(c => !c.primary_role).length
    const noName = qualityCheck.filter(c => !c.first_name || !c.last_name).length
    
    console.log(`  - Uten email: ${noEmail}`)
    console.log(`  - Uten rolle: ${noRole}`)
    console.log(`  - Uten navn: ${noName}`)
    
    // Availability fordeling
    const availabilityStats: Record<string, number> = {}
    qualityCheck.forEach(c => {
      const status = c.availability_status || 'null'
      availabilityStats[status] = (availabilityStats[status] || 0) + 1
    })
    
    console.log('\n  Tilgjengelighet:')
    Object.entries(availabilityStats).forEach(([status, count]) => {
      console.log(`    - ${status}: ${count}`)
    })
    
    // Compliance fordeling
    const complianceStats: Record<string, number> = {}
    qualityCheck.forEach(c => {
      const status = c.compliance_status || 'null'
      complianceStats[status] = (complianceStats[status] || 0) + 1
    })
    
    console.log('\n  Compliance:')
    Object.entries(complianceStats).forEach(([status, count]) => {
      console.log(`    - ${status}: ${count}`)
    })
  }

  console.log('\n=====================================')
  console.log('✅ VERIFISERING FULLFØRT')
  console.log('=====================================\n')
}

syncRemaining()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('💥 FEIL:', err)
    process.exit(1)
  })
