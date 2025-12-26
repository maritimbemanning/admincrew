#!/usr/bin/env python3
"""
Match emails from mbox files to candidates missing CV info.
More aggressive parsing to catch all job applications.
"""

import mailbox
import re
import os
import quopri
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def decode_text(text):
    """Decode quoted-printable and clean text"""
    if not text:
        return ""
    text = text.replace('=\n', '')
    try:
        decoded = quopri.decodestring(text.encode('utf-8', errors='ignore'))
        text = decoded.decode('utf-8', errors='ignore')
    except:
        pass
    text = text.replace('_x000D_', '')
    text = text.replace('\r', '')
    return text

def extract_email_from_text(body):
    """Extract candidate email and info from email body"""
    body = decode_text(body)
    
    result = {
        'email': None,
        'name': None,
        'phone': None,
        'competence': None,
        'desired_work': []
    }
    
    # Look for email pattern
    email_match = re.search(r'E-post:\s*([^\s\n<>]+@[^\s\n<>]+)', body)
    if email_match:
        result['email'] = email_match.group(1).strip().lower()
    
    # Name
    name_match = re.search(r'Navn:\s*([^\n]+)', body)
    if name_match:
        result['name'] = name_match.group(1).strip()
    
    # Phone
    phone_match = re.search(r'Telefon:\s*([0-9\s\+\-]+)', body)
    if phone_match:
        result['phone'] = re.sub(r'[^\d\+]', '', phone_match.group(1))
    
    # Competence
    comp_match = re.search(r'Kompetanse(?:\s*og\s*erfaring)?:(.+?)(?:Andre kommentarer|--|$)', body, re.DOTALL | re.IGNORECASE)
    if comp_match:
        result['competence'] = comp_match.group(1).strip()[:2000]
    
    # Desired work
    desired_match = re.search(r'nsket arbeid:(.+?)(?:pen for|Kompetanse|Andre|--)', body, re.DOTALL | re.IGNORECASE)
    if desired_match:
        work_text = desired_match.group(1)
        roles = re.findall(r'[-\u2022]\s*([^:\n]+)(?::|[\u2013\-])\s*([^\n\u2022-]+)', work_text)
        for cat, role in roles:
            result['desired_work'].append(f"{cat.strip()}:{role.strip()}")
    
    return result

def main():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Get candidates missing CV
    missing = supabase.table('candidates').select('id, email, name').is_('cv_summary', 'null').is_('archived_at', 'null').execute()
    missing_by_email = {c['email'].lower(): c for c in missing.data if c.get('email')}
    print(f"Candidates missing CV: {len(missing_by_email)}")
    
    # Parse all mbox files
    takeout_path = Path(r"C:\Users\isakd\code\admincrew\Takeout\E-post")
    
    all_candidates = {}
    
    for mbox_file in takeout_path.glob("*.mbox"):
        print(f"Parsing {mbox_file.name}...")
        try:
            mbox = mailbox.mbox(str(mbox_file))
            for message in mbox:
                body = ''
                if message.is_multipart():
                    for part in message.walk():
                        if part.get_content_type() == 'text/plain':
                            payload = part.get_payload(decode=True)
                            if payload:
                                body = payload.decode('utf-8', errors='ignore')
                                break
                else:
                    payload = message.get_payload(decode=True)
                    if payload:
                        body = payload.decode('utf-8', errors='ignore')
                
                if body and ('JOBBSØKER' in body.upper() or 'JOBBS' in body.upper()):
                    info = extract_email_from_text(body)
                    if info['email'] and info['email'] not in all_candidates:
                        all_candidates[info['email']] = info
        except Exception as e:
            print(f"  Error: {e}")
    
    print(f"\nFound {len(all_candidates)} unique candidates in emails")
    
    # Match and update
    stats = {'matched': 0, 'updated': 0, 'not_missing': 0}
    
    for email, info in all_candidates.items():
        if email in missing_by_email:
            candidate = missing_by_email[email]
            stats['matched'] += 1
            
            if info['competence'] and len(info['competence']) > 10:
                try:
                    supabase.table('candidates').update({
                        'cv_summary': info['competence']
                    }).eq('id', candidate['id']).execute()
                    stats['updated'] += 1
                    print(f"[OK] {candidate['name']}: Added CV summary")
                except Exception as e:
                    print(f"[ERR] {candidate['name']}: {e}")
        else:
            stats['not_missing'] += 1
    
    print("\n" + "="*60)
    print("RESULTS")
    print("="*60)
    print(f"Matched to missing:    {stats['matched']}")
    print(f"Updated with CV:       {stats['updated']}")
    print(f"Already had CV:        {stats['not_missing']}")
    print(f"Still missing:         {len(missing_by_email) - stats['matched']}")

if __name__ == "__main__":
    main()

