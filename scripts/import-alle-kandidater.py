#!/usr/bin/env python3
"""Import complete candidate list"""

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
    'skipper': ('skipper', ['skipper-styrmann']),
    'overstyrmann': ('chief_mate', ['overstyrmann']),
    'dekksoffiser': ('deck_officer', ['dekksoffiser']),
    'maskinist': ('engineer', ['maskinist-maskinsjef']),
    'maskinoffiser': ('engineer', ['maskinist-maskinsjef']),
    'motormann': ('motorman', ['motormann']),
    'm4': ('engineer', ['maskinist-maskinsjef']),
    'm3': ('engineer', ['maskinist-maskinsjef']),
    'm2': ('engineer', ['maskinist-maskinsjef']),
    'matros': ('deckhand', ['matros']),
    'lettmatros': ('ordinary_seaman', ['matros']),
    'steward': ('steward', ['steward']),
    'forpleining': ('catering_assistant', ['forpleiningsassistent', 'steward']),
    'kokk': ('cook', ['kokk']),
    'fisker': ('fisherman', ['fisker']),
    'fiskeskipper': ('skipper', ['fisker', 'skipper-styrmann']),
    'rov': ('rov_operator', ['rov']),
    'dp': ('dp_operator', ['dp-operator']),
    'havbruk': (None, ['akvatekniker']),
    'oppdrett': (None, ['akvatekniker']),
    'servicebåt': (None, ['servicebat', 'akvatekniker']),
    'serviceboat': (None, ['servicebat']),
    'ambulanse': (None, []),
    'redning': (None, []),
}

def get_role_and_pools(stilling, notat='', erfaring=''):
    text = f"{stilling or ''} {notat or ''} {erfaring or ''}".lower()
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

def parse_experience(erfaring):
    if not erfaring or pd.isna(erfaring):
        return None
    erfaring = str(erfaring).lower()
    if 'nyutdannet' in erfaring:
        return 0
    if '20+' in erfaring or 'over 20' in erfaring:
        return 20
    if '10+' in erfaring or 'over 10' in erfaring:
        return 10
    if '5-10' in erfaring:
        return 7
    if '3-5' in erfaring:
        return 4
    if '1-3' in erfaring:
        return 2
    return None

def main():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    df = pd.read_excel(r'C:\Users\isakd\Downloads\bluecrew_KOMPLETT_alle_kandidater.xlsx')
    print(f"Loaded {len(df)} candidates")
    
    pools_resp = supabase.table('candidate_pools').select('id, slug').execute()
    pools = {p['slug']: p['id'] for p in pools_resp.data}
    
    existing_resp = supabase.table('candidates').select('id, email, cv_summary').execute()
    existing = {c['email'].lower(): c for c in existing_resp.data if c.get('email')}
    
    stats = {'matched': 0, 'updated': 0, 'created': 0, 'pools_added': 0, 'skipped': 0}
    
    for _, row in df.iterrows():
        email = str(row['E-post']).strip().lower() if row.get('E-post') else None
        if not email or '@' not in email:
            stats['skipped'] += 1
            continue
        
        name = row.get('Navn', '')
        stilling = str(row.get('Stilling', '')) if pd.notna(row.get('Stilling')) else ''
        erfaring = str(row.get('Erfaring', '')) if pd.notna(row.get('Erfaring')) else ''
        notat = str(row.get('Notat', '')) if pd.notna(row.get('Notat')) else ''
        phone = str(row.get('Telefon')).replace(' ', '').replace('.0', '') if pd.notna(row.get('Telefon')) else None
        lokasjon = str(row.get('Lokasjon', '')) if pd.notna(row.get('Lokasjon')) else ''
        
        # Build CV summary
        cv_parts = []
        if stilling:
            cv_parts.append(f"Stilling: {stilling}")
        if erfaring:
            cv_parts.append(f"Erfaring: {erfaring}")
        if notat:
            cv_parts.append(notat)
        cv_summary = '\n'.join(cv_parts) if cv_parts else None
        
        primary_role, pool_slugs = get_role_and_pools(stilling, notat, erfaring)
        first_name, last_name = parse_name(name)
        exp_years = parse_experience(erfaring)
        
        if email in existing:
            candidate = existing[email]
            candidate_id = candidate['id']
            stats['matched'] += 1
            
            # Only update if new CV is better
            old_cv = candidate.get('cv_summary') or ''
            new_cv = cv_summary or ''
            
            update_data = {}
            if len(new_cv) > len(old_cv):
                update_data['cv_summary'] = cv_summary
            if primary_role:
                update_data['primary_role'] = primary_role
            if lokasjon and lokasjon != '-':
                update_data['address_city'] = lokasjon
            if exp_years is not None:
                update_data['experience_years'] = exp_years
            
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
                            'notes': 'Komplett alle import'
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
                'experience_years': exp_years,
                'address_city': lokasjon if lokasjon and lokasjon != '-' else None,
                'source': 'excel_import'
            }
            
            result = supabase.table('candidates').insert(new_data).execute()
            candidate_id = result.data[0]['id']
            existing[email] = {'id': candidate_id}
            stats['created'] += 1
            print(f"[NEW] {name}")
            
            for slug in pool_slugs:
                if slug in pools:
                    supabase.table('candidate_pool_memberships').insert({
                        'candidate_id': candidate_id,
                        'pool_id': pools[slug]
                    }).execute()
                    stats['pools_added'] += 1
    
    # Update counts
    for slug, pool_id in pools.items():
        count = supabase.table('candidate_pool_memberships').select('id', count='exact').eq('pool_id', pool_id).execute()
        supabase.table('candidate_pools').update({'candidate_count': count.count or 0}).eq('id', pool_id).execute()
    
    print(f"\n{'='*60}")
    print(f"ALLE KANDIDATER IMPORT")
    print(f"{'='*60}")
    print(f"Matched: {stats['matched']} | Updated: {stats['updated']} | New: {stats['created']} | Pools: {stats['pools_added']}")

if __name__ == "__main__":
    main()

