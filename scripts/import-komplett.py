#!/usr/bin/env python3
"""Import complete candidate data"""

import pandas as pd
import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

ROLE_MAP = {
    'kaptein': ('captain', ['kaptein-skipsforer']),
    'skipsforer': ('captain', ['kaptein-skipsforer']),
    'styrmann': ('mate', ['skipper-styrmann']),
    'd6': ('skipper', ['skipper-styrmann']),
    'd5': ('skipper', ['skipper-styrmann']),
    'd4': ('mate', ['skipper-styrmann']),
    'd3': ('mate', ['skipper-styrmann']),
    'd2': ('mate', ['skipper-styrmann']),
    'd1': ('captain', ['kaptein-skipsforer']),
    'overstyrmann': ('chief_mate', ['overstyrmann']),
    'dekksoffiser': ('deck_officer', ['dekksoffiser', 'skipper-styrmann']),
    'maskinist': ('engineer', ['maskinist-maskinsjef']),
    'maskinoffiser': ('engineer', ['maskinist-maskinsjef']),
    'm4': ('engineer', ['maskinist-maskinsjef']),
    'm3': ('engineer', ['maskinist-maskinsjef']),
    'm2': ('engineer', ['maskinist-maskinsjef']),
    'm1': ('chief_engineer', ['maskinist-maskinsjef']),
    'maskinsjef': ('chief_engineer', ['maskinist-maskinsjef']),
    'matros': ('deckhand', ['matros']),
    'lettmatros': ('ordinary_seaman', ['matros']),
    'steward': ('steward', ['steward']),
    'forpleiningsassistent': ('catering_assistant', ['forpleiningsassistent', 'steward']),
    'kokk': ('cook', ['kokk']),
    'fisker': ('fisherman', ['fisker']),
    'rov': ('rov_operator', ['rov']),
    'dp': ('dp_operator', ['dp-operator']),
    'havbruk': (None, ['akvatekniker']),
    'supply': (None, ['matros']),
    'psv': (None, ['matros']),
    'offshore': (None, []),
}

def get_role_and_pools(stilling, merknader=''):
    text = f"{stilling or ''} {merknader or ''}".lower()
    primary_role = None
    pools = set()
    
    for keyword, (role, pool_list) in ROLE_MAP.items():
        if keyword in text:
            if role and not primary_role:
                primary_role = role
            pools.update(pool_list)
    
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
    
    df = pd.read_excel(r'C:\Users\isakd\Downloads\bluecrew_komplett_kandidater.xlsx')
    print(f"Loaded {len(df)} candidates")
    
    pools_resp = supabase.table('candidate_pools').select('id, slug').execute()
    pools = {p['slug']: p['id'] for p in pools_resp.data}
    
    existing_resp = supabase.table('candidates').select('id, email').execute()
    existing = {c['email'].lower(): c['id'] for c in existing_resp.data if c.get('email')}
    
    stats = {'matched': 0, 'updated': 0, 'created': 0, 'pools_added': 0}
    
    for _, row in df.iterrows():
        email = str(row['E-post']).strip().lower() if row.get('E-post') else None
        if not email or '@' not in email:
            continue
        
        name = row.get('Navn', '')
        stilling = str(row.get('Stilling', '')) if row.get('Stilling') else ''
        merknader = str(row.get('Merknader', '')) if row.get('Merknader') else ''
        phone = str(row.get('Telefon', '')).replace('.0', '') if row.get('Telefon') else None
        lokasjon = row.get('Lokasjon', '')
        verifisert = str(row.get('Verifisert', '')).lower() == 'ja'
        
        cv_summary = f"{stilling}\n{merknader}".strip() if stilling or merknader else None
        primary_role, pool_slugs = get_role_and_pools(stilling, merknader)
        first_name, last_name = parse_name(name)
        
        if email in existing:
            candidate_id = existing[email]
            stats['matched'] += 1
            
            update_data = {}
            if cv_summary and len(cv_summary) > 5:
                update_data['cv_summary'] = cv_summary
            if primary_role:
                update_data['primary_role'] = primary_role
            if lokasjon and not pd.isna(lokasjon) and lokasjon != '-':
                update_data['address_city'] = str(lokasjon)
            if verifisert:
                update_data['vipps_verified'] = True
            
            if update_data:
                supabase.table('candidates').update(update_data).eq('id', candidate_id).execute()
                stats['updated'] += 1
                print(f"[UPD] {name}")
            
            for slug in pool_slugs:
                if slug in pools:
                    check = supabase.table('candidate_pool_memberships').select('id').eq('candidate_id', candidate_id).eq('pool_id', pools[slug]).execute()
                    if not check.data:
                        supabase.table('candidate_pool_memberships').insert({
                            'candidate_id': candidate_id,
                            'pool_id': pools[slug],
                            'notes': 'Komplett import Dec 2025'
                        }).execute()
                        stats['pools_added'] += 1
                        print(f"  -> {slug}")
        else:
            new_data = {
                'email': email,
                'first_name': first_name,
                'last_name': last_name,
                'name': name,
                'phone': phone,
                'cv_summary': cv_summary,
                'primary_role': primary_role,
                'address_city': str(lokasjon) if lokasjon and not pd.isna(lokasjon) and lokasjon != '-' else None,
                'vipps_verified': verifisert,
                'source': 'excel_import'
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
                        'notes': 'Komplett import Dec 2025'
                    }).execute()
                    stats['pools_added'] += 1
    
    # Update counts
    for slug, pool_id in pools.items():
        count = supabase.table('candidate_pool_memberships').select('id', count='exact').eq('pool_id', pool_id).execute()
        supabase.table('candidate_pools').update({'candidate_count': count.count or 0}).eq('id', pool_id).execute()
    
    print(f"\n{'='*50}")
    print(f"Matched: {stats['matched']} | Updated: {stats['updated']} | New: {stats['created']} | Pools: {stats['pools_added']}")

if __name__ == "__main__":
    main()

