#!/usr/bin/env python3
"""
Update candidates in Supabase based on parsed email data.
Matches by email and updates missing fields + assigns to pools.
"""

import json
import os
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Role mapping from email categories to database primary_role
ROLE_MAPPING = {
    'matros': 'deckhand',
    'lettmatros': 'ordinary_seaman', 
    'skipper': 'skipper',
    'styrmann': 'mate',
    'overstyrmann': 'chief_mate',
    'maskinist': 'engineer',
    'maskinsjef': 'chief_engineer',
    'motormann': 'motorman',
    'kokk': 'cook',
    'kokekyndig': 'cook',
    'forpleiningsassistent': 'catering_assistant',
    'forpleiningssjef': 'chief_steward',
    'steward': 'steward',
    'kaptein': 'captain',
    'skipsfører': 'captain',
    'dekksoffiser': 'deck_officer',
    'dp-operatør': 'dp_operator',
    'dp operatør': 'dp_operator',
    'eto': 'eto',
    'elektroteknisk offiser': 'eto',
    'akvatekniker': 'aquaculture_technician',
    'røkter': 'aquaculture_technician',
    'rov': 'rov_operator',
    'fisker': 'fisherman',
}

# Pool slug mapping
POOL_SLUGS = {
    'matros': 'matros',
    'lettmatros': 'matros',
    'skipper': 'skipper-styrmann',
    'styrmann': 'skipper-styrmann',
    'overstyrmann': 'overstyrmann',
    'maskinist': 'maskinist-maskinsjef',
    'maskinsjef': 'maskinist-maskinsjef',
    'motormann': 'motormann',
    'kokk': 'kokk',
    'kokekyndig': 'kokk',
    'forpleiningsassistent': 'forpleiningsassistent',
    'forpleiningssjef': 'forpleiningssjef',
    'steward': 'steward',
    'kaptein': 'kaptein-skipsforer',
    'skipsfører': 'kaptein-skipsforer',
    'dekksoffiser': 'dekksoffiser',
    'dp-operatør': 'dp-operator',
    'eto': 'eto',
    'akvatekniker': 'akvatekniker',
    'røkter': 'akvatekniker',
    'rov': 'rov',
    'fisker': 'fisker',
}

def get_primary_role(desired_work: list) -> str:
    """Determine primary role from desired work list"""
    for work in desired_work:
        work_lower = work.lower()
        for keyword, role in ROLE_MAPPING.items():
            if keyword in work_lower:
                return role
    return None

def get_pool_slugs(desired_work: list) -> list:
    """Get pool slugs from desired work list"""
    pools = set()
    for work in desired_work:
        work_lower = work.lower()
        for keyword, slug in POOL_SLUGS.items():
            if keyword in work_lower:
                pools.add(slug)
    return list(pools)

def main():
    # Initialize Supabase client
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: Missing Supabase credentials in .env.local")
        return
    
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Load parsed email data
    json_path = Path(__file__).parent / "candidates_from_emails.json"
    with open(json_path, 'r', encoding='utf-8') as f:
        email_candidates = json.load(f)
    
    print(f"Loaded {len(email_candidates)} candidates from emails")
    
    # Filter out test emails and empty entries
    email_candidates = [
        c for c in email_candidates 
        if c['email'] 
        and c['name']
        and '@' in c['email']
        and 'test' not in c['email'].lower()
        and 'bluecrew' not in c['email'].lower()
    ]
    print(f"After filtering: {len(email_candidates)} valid candidates")
    
    # Get all pools
    pools_response = supabase.table('candidate_pools').select('id, slug, name').execute()
    pools = {p['slug']: p['id'] for p in pools_response.data}
    print(f"Found {len(pools)} pools in database")
    
    # Get all candidates from database
    db_candidates = supabase.table('candidates').select('id, email').execute()
    db_by_email = {c['email'].lower(): c['id'] for c in db_candidates.data if c['email']}
    print(f"Found {len(db_by_email)} candidates in database")
    
    # Track statistics
    stats = {
        'matched': 0,
        'updated': 0,
        'pools_added': 0,
        'not_found': 0,
        'errors': 0
    }
    
    not_found_emails = []
    
    for ec in email_candidates:
        email = ec['email'].lower()
        
        # Check if candidate exists in database
        if email not in db_by_email:
            stats['not_found'] += 1
            not_found_emails.append({
                'email': ec['email'],
                'name': ec['name'],
                'phone': ec.get('phone'),
                'desired_work': ec.get('desired_work', [])
            })
            continue
        
        candidate_id = db_by_email[email]
        stats['matched'] += 1
        
        # Prepare update data
        update_data = {}
        
        # Update city and postal code if available
        if ec.get('city'):
            update_data['address_city'] = ec['city']
        if ec.get('postal_code'):
            update_data['address_postal_code'] = ec['postal_code']
        
        # Update CV summary from competence
        if ec.get('competence'):
            update_data['cv_summary'] = ec['competence'][:2000]  # Limit length
        
        # Update primary role based on desired work
        desired_work = ec.get('desired_work', [])
        primary_role = get_primary_role(desired_work)
        if primary_role:
            update_data['primary_role'] = primary_role
        
        # Update availability
        if ec.get('available_from'):
            update_data['availability_date'] = ec['available_from']
        
        # Update if we have data
        if update_data:
            try:
                supabase.table('candidates').update(update_data).eq('id', candidate_id).execute()
                stats['updated'] += 1
                print(f"[OK] Updated {ec['name']}: {list(update_data.keys())}")
            except Exception as e:
                stats['errors'] += 1
                print(f"[ERR] Error updating {ec['name']}: {e}")
        
        # Add to pools
        pool_slugs = get_pool_slugs(desired_work)
        for slug in pool_slugs:
            if slug in pools:
                pool_id = pools[slug]
                try:
                    # Check if already in pool
                    existing = supabase.table('candidate_pool_memberships').select('id').eq('candidate_id', candidate_id).eq('pool_id', pool_id).execute()
                    
                    if not existing.data:
                        supabase.table('candidate_pool_memberships').insert({
                            'candidate_id': candidate_id,
                            'pool_id': pool_id,
                            'notes': f"Added from email: {', '.join(desired_work[:2])}"
                        }).execute()
                        stats['pools_added'] += 1
                        print(f"  -> Added to pool: {slug}")
                except Exception as e:
                    print(f"  [ERR] Error adding to pool {slug}: {e}")
    
    # Print summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Matched:       {stats['matched']}")
    print(f"Updated:       {stats['updated']}")
    print(f"Pools added:   {stats['pools_added']}")
    print(f"Not found:     {stats['not_found']}")
    print(f"Errors:        {stats['errors']}")
    
    # Save not found candidates for potential manual creation
    if not_found_emails:
        not_found_path = Path(__file__).parent / "candidates_not_found.json"
        with open(not_found_path, 'w', encoding='utf-8') as f:
            json.dump(not_found_emails, f, ensure_ascii=False, indent=2)
        print(f"\nNot found candidates saved to: {not_found_path}")
        print("\nSample not found:")
        for c in not_found_emails[:5]:
            print(f"  - {c['name']} <{c['email']}>")

if __name__ == "__main__":
    main()

