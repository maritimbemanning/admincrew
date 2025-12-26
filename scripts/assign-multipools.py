#!/usr/bin/env python3
"""
Assign candidates to multiple pools based on their cv_summary.
Scans for ALL relevant keywords and adds to all matching pools.
"""

import os
import re
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Comprehensive keyword to pool mapping
# Each pool has multiple keywords that can match
POOL_KEYWORDS = {
    'kaptein-skipsforer': [
        'kaptein', 'skipsforer', 'skipsfører', 'captain', 'master mariner',
        'd1 ', 'd1,', 'd1.', 'dekksoffiser kl. 1', 'skipssjef'
    ],
    'overstyrmann': [
        'overstyrmann', 'overstyrmand', 'chief officer', 'chief mate',
        '1st officer', 'forstestyrmann', 'førstestyrmann'
    ],
    'skipper-styrmann': [
        'styrmann', 'styrmand', 'skipper', 'd2', 'd3', 'd4', 'd5', 'd6',
        'navigasjonsoffiser', 'navigatør', 'mate ', 'officer', 'dekksoffiser',
        'brovakt', 'navigasjon'
    ],
    'maskinist-maskinsjef': [
        'maskinist', 'maskinsjef', 'maskin', 'engineer', 'motor',
        'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'maskinrom', 'teknisk',
        'vedlikehold', 'mekaniker', 'hydraulikk'
    ],
    'motormann': [
        'motormann', 'motorman', 'motorpasser', 'smorer', 'smører'
    ],
    'matros': [
        'matros', 'lettmatros', 'lättmatros', 'dekksmann', 'dekk',
        'able seaman', 'ab ', 'ordinary seaman', 'os ', 'sjømann',
        'fortøyning', 'ankerhåndtering', 'dekksarbeid'
    ],
    'kokk': [
        'kokk', 'cook', 'kjøkken', 'galley', 'forpleining', 'stuert',
        'catering', 'mat', 'restaurasjon', 'messe', 'proviant'
    ],
    'steward': [
        'steward', 'forpleiningsassistent', 'renhold', 'housekeeping',
        'service', 'servering', 'cabin', 'lugar'
    ],
    'eto': [
        'eto', 'elektroteknisk', 'elektro', 'elektriker', 'elektrikk',
        'automasjon', 'automatiker', 'it ', 'data', 'elektronikk'
    ],
    'dp-operator': [
        'dp ', 'dp-', 'dynamic positioning', 'dynamisk posisjonering',
        'posisjonering'
    ],
    'rov': [
        'rov', 'rov-', 'subsea', 'undervanns', 'dykker', 'diving'
    ],
    'fisker': [
        'fisk', 'tråler', 'trål', 'garn', 'not ', 'snurpe',
        'fangst', 'fiskebåt', 'fiskeri', 'sjark', 'line'
    ],
    'akvatekniker': [
        'akva', 'havbruk', 'oppdrett', 'merd', 'laks', 'ørret',
        'røkt', 'slakt', 'brønn', 'servicefart', 'behandling',
        'lusebehandling', 'foring', 'rensefisk'
    ],
    'servicebat': [
        'servicebåt', 'servicefartøy', 'arbeidsbåt', 'workboat',
        'support vessel', 'crew boat'
    ],
}

def find_matching_pools(text):
    """Find all pools that match keywords in the text"""
    if not text:
        return []
    
    text_lower = text.lower()
    matching_pools = set()
    
    for pool_slug, keywords in POOL_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text_lower:
                matching_pools.add(pool_slug)
                break  # Found match for this pool, move to next
    
    return list(matching_pools)

def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: Missing Supabase credentials")
        return
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Get all pools
    pools_resp = supabase.table('candidate_pools').select('id, slug, name').execute()
    pools = {p['slug']: {'id': p['id'], 'name': p['name']} for p in pools_resp.data}
    print(f"Found {len(pools)} pools")
    
    # Get all candidates with cv_summary
    candidates_resp = supabase.table('candidates').select('id, name, cv_summary').is_('archived_at', 'null').execute()
    candidates = [c for c in candidates_resp.data if c.get('cv_summary')]
    print(f"Found {len(candidates)} candidates with CV summary")
    
    # Get existing memberships
    memberships_resp = supabase.table('candidate_pool_memberships').select('candidate_id, pool_id').execute()
    existing = set((m['candidate_id'], m['pool_id']) for m in memberships_resp.data)
    print(f"Existing memberships: {len(existing)}")
    
    stats = {'added': 0, 'skipped': 0, 'errors': 0}
    
    for candidate in candidates:
        matching_pools = find_matching_pools(candidate['cv_summary'])
        
        for pool_slug in matching_pools:
            if pool_slug not in pools:
                continue
            
            pool_id = pools[pool_slug]['id']
            
            # Check if already member
            if (candidate['id'], pool_id) in existing:
                stats['skipped'] += 1
                continue
            
            # Add to pool
            try:
                supabase.table('candidate_pool_memberships').insert({
                    'candidate_id': candidate['id'],
                    'pool_id': pool_id,
                    'notes': 'Multi-pool auto-assign from CV'
                }).execute()
                
                stats['added'] += 1
                existing.add((candidate['id'], pool_id))
                print(f"[+] {candidate['name']} -> {pools[pool_slug]['name']}")
                
            except Exception as e:
                stats['errors'] += 1
                print(f"[ERR] {candidate['name']} -> {pool_slug}: {e}")
    
    # Update pool counts
    print("\nUpdating pool counts...")
    supabase.table('candidate_pools').select('id').execute()  # Trigger
    
    # Manual count update
    for pool_slug, pool_info in pools.items():
        count_resp = supabase.table('candidate_pool_memberships').select('id', count='exact').eq('pool_id', pool_info['id']).execute()
        count = count_resp.count or 0
        supabase.table('candidate_pools').update({'candidate_count': count}).eq('id', pool_info['id']).execute()
    
    print("\n" + "="*60)
    print("MULTI-POOL ASSIGNMENT COMPLETE")
    print("="*60)
    print(f"New pool assignments: {stats['added']}")
    print(f"Already existed:      {stats['skipped']}")
    print(f"Errors:               {stats['errors']}")

if __name__ == "__main__":
    main()

