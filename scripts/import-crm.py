#!/usr/bin/env python3
"""Import CRM contacts from Excel"""

import pandas as pd
import os
import re
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def clean_phone(phone):
    if not phone or pd.isna(phone):
        return None
    phone = str(phone).replace(' ', '').replace('.0', '')
    return phone if phone else None

def parse_name(full_name):
    if not full_name or pd.isna(full_name):
        return None, None
    parts = str(full_name).strip().split()
    if len(parts) == 1:
        return parts[0], None
    return parts[0], ' '.join(parts[1:])

def main():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    df = pd.read_excel(r'C:\Users\isakd\code\bluecrew-admin\crm-kontakter.xlsx')
    print(f"Loaded {len(df)} contacts")
    
    # Track organizations
    orgs = {}  # org name -> org id
    
    stats = {'orgs_created': 0, 'contacts_created': 0}
    
    for _, row in df.iterrows():
        org_name = str(row.get('organisasjon', '')).strip() if pd.notna(row.get('organisasjon')) else None
        contact_name = str(row.get('navn', '')).strip() if pd.notna(row.get('navn')) else None
        email = str(row.get('epost', '')).strip().lower() if pd.notna(row.get('epost')) else None
        phone = clean_phone(row.get('telefon'))
        stilling = str(row.get('stilling', '')).strip() if pd.notna(row.get('stilling')) else None
        
        if not contact_name:
            continue
        
        # Create or get organization
        org_id = None
        if org_name:
            org_key = org_name.lower()
            if org_key in orgs:
                org_id = orgs[org_key]
            else:
                # Check if exists
                existing = supabase.table('crm_organizations').select('id').ilike('name', org_name).execute()
                if existing.data:
                    org_id = existing.data[0]['id']
                else:
                    # Create org
                    org_data = {
                        'name': org_name,
                        'industry': 'Maritime',
                        'customer_type': 'prospect'
                    }
                    result = supabase.table('crm_organizations').insert(org_data).execute()
                    org_id = result.data[0]['id']
                    stats['orgs_created'] += 1
                    print(f"[ORG] {org_name}")
                
                orgs[org_key] = org_id
        
        # Create contact
        first_name, last_name = parse_name(contact_name)
        
        # Check if contact exists
        if email:
            existing_contact = supabase.table('crm_contacts').select('id').ilike('email', email).execute()
            if existing_contact.data:
                print(f"[SKIP] {contact_name} - exists")
                continue
        
        contact_data = {
            'first_name': first_name or contact_name,
            'last_name': last_name or '-',
            'email': email,
            'phone': phone,
            'job_title': stilling,
            'organization_id': org_id,
            'is_primary': True
        }
        
        supabase.table('crm_contacts').insert(contact_data).execute()
        stats['contacts_created'] += 1
        print(f"[+] {contact_name} @ {org_name or 'Ingen org'}")
    
    print(f"\n{'='*50}")
    print(f"CRM IMPORT COMPLETE")
    print(f"{'='*50}")
    print(f"Organizations created: {stats['orgs_created']}")
    print(f"Contacts created:      {stats['contacts_created']}")

if __name__ == "__main__":
    main()

