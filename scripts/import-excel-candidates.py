#!/usr/bin/env python3
"""
Import candidates from Excel file to Supabase.
Updates existing candidates and creates new ones.
"""

import pandas as pd
import re
import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Role detection from experience text
ROLE_KEYWORDS = {
    'captain': ['kaptein', 'skipsforer', 'skipper d1', 'd1 kaptein'],
    'chief_mate': ['overstyrmann', 'overstyrmand'],
    'mate': ['styrmann', 'styrmand', 'd2', 'd3', 'd4'],
    'chief_engineer': ['maskinsjef', 'chief engineer'],
    'engineer': ['maskinist', 'maskin', 'm1', 'm2', 'm3', 'm4'],
    'deckhand': ['matros', 'lettmatros', 'dekksmann'],
    'ordinary_seaman': ['lettmatros', 'os ', 'ordinary seaman'],
    'cook': ['kokk', 'stuert', 'forpleining', 'galley'],
    'steward': ['steward', 'forpleiningsassistent'],
    'eto': ['eto', 'elektroteknisk'],
    'dp_operator': ['dp ', 'dp-operator', 'dynamic positioning'],
    'rov_operator': ['rov'],
    'fisherman': ['fisker', 'fiskeri', 'garnbat', 'tralerfiske'],
    'aquaculture_technician': ['havbruk', 'akva', 'oppdrett', 'merd'],
    'skipper': ['skipper', 'd5', 'd6'],
}

POOL_MAPPING = {
    'captain': 'kaptein-skipsforer',
    'chief_mate': 'overstyrmann',
    'mate': 'skipper-styrmann',
    'chief_engineer': 'maskinist-maskinsjef',
    'engineer': 'maskinist-maskinsjef',
    'deckhand': 'matros',
    'ordinary_seaman': 'matros',
    'cook': 'kokk',
    'steward': 'steward',
    'eto': 'eto',
    'dp_operator': 'dp-operator',
    'rov_operator': 'rov',
    'fisherman': 'fisker',
    'aquaculture_technician': 'akvatekniker',
    'skipper': 'skipper-styrmann',
}

def detect_role(text):
    """Detect primary role from experience text"""
    if not text or pd.isna(text):
        return None
    
    text_lower = str(text).lower()
    
    # Priority order - more specific roles first
    priority = ['captain', 'chief_mate', 'chief_engineer', 'mate', 'engineer', 
                'eto', 'dp_operator', 'rov_operator', 'cook', 'steward',
                'skipper', 'fisherman', 'aquaculture_technician', 'deckhand', 'ordinary_seaman']
    
    for role in priority:
        for keyword in ROLE_KEYWORDS[role]:
            if keyword in text_lower:
                return role
    
    return None

def detect_pools(text):
    """Detect all applicable pools from experience text"""
    if not text or pd.isna(text):
        return []
    
    text_lower = str(text).lower()
    pools = set()
    
    for role, keywords in ROLE_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text_lower:
                if role in POOL_MAPPING:
                    pools.add(POOL_MAPPING[role])
                break
    
    return list(pools)

def clean_text(text):
    """Clean text from Excel formatting"""
    if not text or pd.isna(text):
        return None
    
    text = str(text)
    # Remove Excel line breaks
    text = text.replace('_x000D_', '')
    text = text.replace('\r', '')
    # Clean up multiple newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def parse_name(full_name):
    """Split full name into first and last name"""
    if not full_name or pd.isna(full_name):
        return None, None
    
    parts = str(full_name).strip().split()
    if len(parts) == 1:
        return parts[0], None
    elif len(parts) == 2:
        return parts[0], parts[1]
    else:
        # First name is first part, last name is the rest
        return parts[0], ' '.join(parts[1:])

def main():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: Missing Supabase credentials")
        return
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Load Excel
    df = pd.read_excel(r'C:\Users\isakd\Desktop\AlleSøkere_SENDTILAI.xlsx')
    print(f"Loaded {len(df)} candidates from Excel")
    
    # Get pools
    pools_resp = supabase.table('candidate_pools').select('id, slug').execute()
    pools = {p['slug']: p['id'] for p in pools_resp.data}
    print(f"Found {len(pools)} pools")
    
    # Get existing candidates
    candidates_resp = supabase.table('candidates').select('id, email').execute()
    existing = {c['email'].lower(): c['id'] for c in candidates_resp.data if c['email']}
    print(f"Found {len(existing)} existing candidates")
    
    stats = {
        'matched': 0,
        'updated': 0,
        'created': 0,
        'pools_added': 0,
        'skipped': 0,
        'errors': 0
    }
    
    for idx, row in df.iterrows():
        email = row['E-post']
        if not email or pd.isna(email):
            stats['skipped'] += 1
            continue
        
        email = str(email).strip().lower()
        name = row['Navn']
        phone = row['Telefon']
        erfaring = clean_text(row.get('Erfaring'))
        
        first_name, last_name = parse_name(name)
        primary_role = detect_role(erfaring)
        pool_slugs = detect_pools(erfaring)
        
        # Check if exists
        if email in existing:
            candidate_id = existing[email]
            stats['matched'] += 1
            
            # Prepare update
            update_data = {}
            
            if erfaring and len(erfaring) > 10:
                update_data['cv_summary'] = erfaring[:2000]
            
            if primary_role:
                update_data['primary_role'] = primary_role
            
            if update_data:
                try:
                    supabase.table('candidates').update(update_data).eq('id', candidate_id).execute()
                    stats['updated'] += 1
                    print(f"[UPD] {name}: {list(update_data.keys())}")
                except Exception as e:
                    stats['errors'] += 1
                    print(f"[ERR] Update {name}: {e}")
            
            # Add to pools
            for slug in pool_slugs:
                if slug in pools:
                    try:
                        # Check if already exists
                        check = supabase.table('candidate_pool_memberships').select('id').eq('candidate_id', candidate_id).eq('pool_id', pools[slug]).execute()
                        if not check.data:
                            supabase.table('candidate_pool_memberships').insert({
                                'candidate_id': candidate_id,
                                'pool_id': pools[slug],
                                'notes': 'Excel import Dec 2025'
                            }).execute()
                            stats['pools_added'] += 1
                            print(f"  -> Pool: {slug}")
                    except Exception as e:
                        print(f"  [ERR] Pool {slug}: {e}")
        else:
            # Create new candidate
            try:
                phone_str = str(int(phone)) if phone and not pd.isna(phone) else None
                
                new_candidate = {
                    'email': email,
                    'first_name': first_name,
                    'last_name': last_name,
                    'name': name,
                    'phone': phone_str,
                    'cv_summary': erfaring[:2000] if erfaring else None,
                    'primary_role': primary_role,
                    'source': 'excel_import',
                    'source_details': {'import': 'excel_dec_2025'}
                }
                
                result = supabase.table('candidates').insert(new_candidate).execute()
                candidate_id = result.data[0]['id']
                stats['created'] += 1
                print(f"[NEW] {name} <{email}>")
                
                # Add to pools
                for slug in pool_slugs:
                    if slug in pools:
                        try:
                            supabase.table('candidate_pool_memberships').insert({
                                'candidate_id': candidate_id,
                                'pool_id': pools[slug],
                                'notes': 'Excel import Dec 2025'
                            }).execute()
                            stats['pools_added'] += 1
                            print(f"  -> Pool: {slug}")
                        except Exception as e:
                            print(f"  [ERR] Pool {slug}: {e}")
                
                # Add to existing dict
                existing[email] = candidate_id
                
            except Exception as e:
                stats['errors'] += 1
                print(f"[ERR] Create {name}: {e}")
    
    # Update pool counts
    print("\nUpdating pool counts...")
    supabase.rpc('update_pool_counts', {}).execute()
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Matched existing: {stats['matched']}")
    print(f"Updated:          {stats['updated']}")
    print(f"Created new:      {stats['created']}")
    print(f"Pools added:      {stats['pools_added']}")
    print(f"Skipped:          {stats['skipped']}")
    print(f"Errors:           {stats['errors']}")

if __name__ == "__main__":
    main()

