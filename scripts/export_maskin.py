from supabase import create_client
import os
import pandas as pd
from dotenv import load_dotenv
load_dotenv('.env.local')

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(url, key)

# 1. Hent ALLE kandidater
result = supabase.table('candidates').select('*').execute()
df = pd.DataFrame(result.data)
df['full_name'] = df['first_name'].fillna('') + ' ' + df['last_name'].fillna('')
print(f'Totalt kandidater i DB: {len(df)}')

# 2. Hent maskin-pool medlemmer
pools = supabase.table('candidate_pools').select('id, slug').execute()
maskin_pool = next((p for p in pools.data if p['slug'] == 'maskinist-maskinsjef'), None)
motormann_pool = next((p for p in pools.data if p['slug'] == 'motormann'), None)
eto_pool = next((p for p in pools.data if p['slug'] == 'eto'), None)

pool_ids = [p['id'] for p in [maskin_pool, motormann_pool, eto_pool] if p]
memberships = supabase.table('candidate_pool_memberships').select('candidate_id, pool_id').execute()
pool_candidate_ids = set([m['candidate_id'] for m in memberships.data if m['pool_id'] in pool_ids])
print(f'I maskin-relaterte pools: {len(pool_candidate_ids)}')

# 3. Søkeord for maskinfolk
maskin_keywords = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'maskin', 'engineer', 'motor', 'chief eng', 'maskinist', 'maskinsjef', 'maskinoffiser', 'eto', 'electro']

def search_all_fields(row):
    text_fields = [
        str(row.get('primary_role') or ''),
        str(row.get('secondary_roles') or ''),
        str(row.get('cv_summary') or ''),
        str(row.get('internal_notes') or ''),
        str(row.get('tags') or ''),
        str(row.get('experience_details') or ''),
    ]
    combined = ' '.join(text_fields).lower()
    for kw in maskin_keywords:
        if kw in combined:
            return True
    return False

# Kombiner alle kilder
text_match_ids = set(df[df.apply(search_all_fields, axis=1)]['id'].tolist())
all_maskin_ids = pool_candidate_ids.union(text_match_ids)
print(f'Tekst-match: {len(text_match_ids)}')
print(f'TOTALT UNIKE MASKINFOLK: {len(all_maskin_ids)}')

# Filtrer og eksporter
df_maskin = df[df['id'].isin(all_maskin_ids)].copy()

# Eksporter
cols = ['full_name', 'first_name', 'last_name', 'email', 'phone', 'primary_role', 'secondary_roles', 'availability_status', 'experience_years', 'address_city', 'cv_summary', 'id']
df[cols].to_excel('alle_kandidater.xlsx', index=False)
df_maskin[cols].to_excel('maskinsjefer_og_maskinister.xlsx', index=False)

print(f'\nLagret: alle_kandidater.xlsx ({len(df)} kandidater)')
print(f'Lagret: maskinsjefer_og_maskinister.xlsx ({len(df_maskin)} kandidater)')

# E-poster
emails = df_maskin[df_maskin['email'].notna() & (df_maskin['email'] != '')]['email'].unique().tolist()
print('\n' + '='*60)
print(f'E-POSTER TIL MASKINFOLK ({len(emails)} stk):')
print('='*60)
print('; '.join(emails))
