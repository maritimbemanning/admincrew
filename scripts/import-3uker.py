#!/usr/bin/env python3
"""Import 3-week candidate data"""

import pandas as pd
import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Map Norwegian roles to database roles and pools
ROLE_MAP = {
    'kaptein': ('captain', 'kaptein-skipsforer'),
    'skipsforer': ('captain', 'kaptein-skipsforer'),
    'styrmann': ('mate', 'skipper-styrmann'),
    'overstyrmann': ('chief_mate', 'overstyrmann'),
    'dekksoffiser': ('deck_officer', 'dekksoffiser'),
    'maskinist': ('engineer', 'maskinist-maskinsjef'),
    'maskinoffiser': ('engineer', 'maskinist-maskinsjef'),
    'maskinsjef': ('chief_engineer', 'maskinist-maskinsjef'),
    'matros': ('deckhand', 'matros'),
    'steward': ('steward', 'steward'),
    'forpleiningsassistent': ('catering_assistant', 'forpleiningsassistent'),
    'kokk': ('cook', 'kokk'),
    'fisker': ('fisherman', 'fisker'),
    'rov': ('rov_operator', 'rov'),
    'dp': ('dp_operator', 'dp-operator'),
}

def get_role_and_pools(stilling):
    """Extract role and pool slugs from stilling text"""
    if not stilling or pd.isna(stilling):
        return None, []
    
    stilling_lower = stilling.lower()
    primary_role = None
    pools = set()
    
    for keyword, (role, pool) in ROLE_MAP.items():
        if keyword in stilling_lower:
            if primary_role is None:
                primary_role = role
            pools.add(pool)
    
    return primary_role, list(pools)

def parse_name(full_name):
    if not full_name or pd.isna(full_name):
        return None, None
    parts = str(full_name).strip().split()
    if len(parts) == 1:
        return parts[0], None
    return parts[0], ' '.join(parts[1:])

def main():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    df = pd.read_excel(r'C:\Users\isakd\Downloads\bluecrew_kandidater_3uker.xlsx')
    print(f"Loaded {len(df)} candidates")
    
    # Get pools
    pools_resp = supabase.table('candidate_pools').select('id, slug').execute()
    pools = {p['slug']: p['id'] for p in pools_resp.data}
    
    # Get existing candidates
    existing_resp = supabase.table('candidates').select('id, email').execute()
    existing = {c['email'].lower(): c['id'] for c in existing_resp.data if c.get('email')}
    
    stats = {'matched': 0, 'updated': 0, 'created': 0, 'pools_added': 0}
    
    for _, row in df.iterrows():
        email = str(row['E-post']).strip().lower() if row.get('E-post') else None
        if not email or '@' not in email:
            continue
        
        name = row.get('Navn', '')
        stilling = row.get('Stilling', '')
        erfaring = row.get('Erfaring', '')
        merknader = row.get('Merknader', '')
        phone = str(row.get('Telefon', '')).replace('.0', '') if row.get('Telefon') else None
        lokasjon = row.get('Lokasjon', '')
        
        # Build CV summary
        cv_parts = []
        if stilling and not pd.isna(stilling):
            cv_parts.append(f"Stilling: {stilling}")
        if erfaring and not pd.isna(erfaring) and erfaring != '-':
            cv_parts.append(f"Erfaring: {erfaring}")
        if merknader and not pd.isna(merknader):
            cv_parts.append(merknader)
        
        cv_summary = '\n'.join(cv_parts) if cv_parts else None
        
        primary_role, pool_slugs = get_role_and_pools(stilling)
        first_name, last_name = parse_name(name)
        
        if email in existing:
            # Update existing
            candidate_id = existing[email]
            stats['matched'] += 1
            
            update_data = {}
            if cv_summary:
                update_data['cv_summary'] = cv_summary
            if primary_role:
                update_data['primary_role'] = primary_role
            if lokasjon and not pd.isna(lokasjon) and lokasjon != '-':
                update_data['address_city'] = lokasjon
            
            if update_data:
                supabase.table('candidates').update(update_data).eq('id', candidate_id).execute()
                stats['updated'] += 1
                print(f"[UPD] {name}: {list(update_data.keys())}")
            
            # Add pools
            for slug in pool_slugs:
                if slug in pools:
                    check = supabase.table('candidate_pool_memberships').select('id').eq('candidate_id', candidate_id).eq('pool_id', pools[slug]).execute()
                    if not check.data:
                        supabase.table('candidate_pool_memberships').insert({
                            'candidate_id': candidate_id,
                            'pool_id': pools[slug],
                            'notes': '3-week import Dec 2025'
                        }).execute()
                        stats['pools_added'] += 1
                        print(f"  -> Pool: {slug}")
        else:
            # Create new
            new_data = {
                'email': email,
                'first_name': first_name,
                'last_name': last_name,
                'name': name,
                'phone': phone,
                'cv_summary': cv_summary,
                'primary_role': primary_role,
                'address_city': lokasjon if lokasjon and not pd.isna(lokasjon) and lokasjon != '-' else None,
                'source': 'excel_import',
                'source_details': {'import': '3uker_dec_2025'}
            }
            
            result = supabase.table('candidates').insert(new_data).execute()
            candidate_id = result.data[0]['id']
            existing[email] = candidate_id
            stats['created'] += 1
            print(f"[NEW] {name}")
            
            for slug in pool_slugs:
                if slug in pools:
                    supabase.table('candidate_pool_memberships').insert({
                        'candidate_id': candidate_id,
                        'pool_id': pools[slug],
                        'notes': '3-week import Dec 2025'
                    }).execute()
                    stats['pools_added'] += 1
                    print(f"  -> Pool: {slug}")
    
    # Update pool counts
    for slug, pool_id in pools.items():
        count = supabase.table('candidate_pool_memberships').select('id', count='exact').eq('pool_id', pool_id).execute()
        supabase.table('candidate_pools').update({'candidate_count': count.count or 0}).eq('id', pool_id).execute()
    
    print("\n" + "="*60)
    print("3-WEEK IMPORT COMPLETE")
    print("="*60)
    print(f"Matched existing: {stats['matched']}")
    print(f"Updated:          {stats['updated']}")
    print(f"Created new:      {stats['created']}")
    print(f"Pools added:      {stats['pools_added']}")

if __name__ == "__main__":
    main()

