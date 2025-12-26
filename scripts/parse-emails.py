#!/usr/bin/env python3
"""
Email Parser for Bluecrew Candidates
Parses MBOX files and extracts candidate information for database updates and pool assignments.
"""

import mailbox
import re
import json
import quopri
from pathlib import Path
from email.header import decode_header
from dataclasses import dataclass, asdict
from typing import Optional, List
import os

@dataclass
class CandidateFromEmail:
    """Parsed candidate data from email"""
    email: str
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    available_from: Optional[str] = None
    open_for_temporary: bool = False
    stcw_confirmed: bool = False
    desired_work: List[str] = None
    competence: Optional[str] = None
    comments: Optional[str] = None
    source_file: Optional[str] = None
    email_date: Optional[str] = None
    
    def __post_init__(self):
        if self.desired_work is None:
            self.desired_work = []

# Mapping from Norwegian job titles to pool slugs
ROLE_TO_POOL = {
    # Servicefartøy
    'matros': 'matros',
    'skipper': 'skipper-styrmann',
    'styrmann': 'skipper-styrmann',
    'maskinist': 'maskinist-maskinsjef',
    'maskinsjef': 'maskinist-maskinsjef',
    'kokk': 'kokk',
    'kokekyndig': 'kokk',
    'forpleiningsassistent': 'forpleiningsassistent',
    'forpleiningssjef': 'forpleiningssjef',
    'steward': 'steward',
    
    # Offshore
    'kaptein': 'kaptein-skipsforer',
    'skipsfører': 'kaptein-skipsforer',
    'overstyrmann': 'overstyrmann',
    'dekksoffiser': 'dekksoffiser',
    'dp-operatør': 'dp-operator',
    'dp operatør': 'dp-operator',
    'eto': 'eto',
    'elektroteknisk offiser': 'eto',
    'motormann': 'motormann',
    
    # Havbruk
    'akvatekniker': 'akvatekniker',
    'røkter': 'akvatekniker',
    'driftstekniker': 'akvatekniker',
    
    # Annet
    'rov': 'rov',
    'rov-operatør': 'rov',
    'fisker': 'fisker',
    'servicebåt': 'servicebat',
}

def decode_quoted_printable(text: str) -> str:
    """Decode quoted-printable encoding"""
    try:
        # Replace soft line breaks
        text = text.replace('=\n', '')
        # Decode
        decoded = quopri.decodestring(text.encode('utf-8', errors='ignore'))
        return decoded.decode('utf-8', errors='ignore')
    except Exception:
        return text

def parse_email_body(body: str) -> Optional[CandidateFromEmail]:
    """Parse email body to extract candidate info"""
    
    # Decode quoted-printable if needed
    if '=' in body and ('=C3' in body or '=20' in body):
        body = decode_quoted_printable(body)
    
    # Check if this is a job application email
    if 'NY JOBBSØKER' not in body.upper() and 'JOBBS' not in body.upper():
        return None
    
    candidate = CandidateFromEmail(email='', name='')
    
    # Extract name
    name_match = re.search(r'Navn:\s*([^\n]+)', body)
    if name_match:
        candidate.name = name_match.group(1).strip()
    
    # Extract email
    email_match = re.search(r'E-post:\s*([^\s\n]+@[^\s\n]+)', body)
    if email_match:
        candidate.email = email_match.group(1).strip().lower()
    
    # Extract phone
    phone_match = re.search(r'Telefon:\s*([0-9\s\+\-]+)', body)
    if phone_match:
        candidate.phone = re.sub(r'[^\d\+]', '', phone_match.group(1).strip())
    
    # Extract address with postal code
    address_match = re.search(r'Adresse:\s*([^\n]+)', body)
    if address_match:
        addr = address_match.group(1).strip()
        candidate.address = addr
        # Try to extract postal code
        postal_match = re.search(r'\((\d{4})\)', addr)
        if postal_match:
            candidate.postal_code = postal_match.group(1)
            # City is the part before postal code
            city = re.sub(r'\s*\(\d{4}\)\s*', '', addr).strip()
            candidate.city = city
    
    # Extract availability
    avail_match = re.search(r'Tilgjengelig fra:\s*(\d{4}-\d{2}-\d{2})', body)
    if avail_match:
        candidate.available_from = avail_match.group(1)
    
    # Extract open for temporary
    temp_match = re.search(r'(?:Åpen for|Midlertidige)\s*(?:midlertidige)?\s*oppdrag:\s*(ja|nei)', body, re.IGNORECASE)
    if temp_match:
        candidate.open_for_temporary = temp_match.group(1).lower() == 'ja'
    
    # Extract STCW status
    stcw_match = re.search(r'STCW\s*(?:bekreftet)?:\s*(Ja|Nei)', body, re.IGNORECASE)
    if stcw_match:
        candidate.stcw_confirmed = stcw_match.group(1).lower() == 'ja'
    
    # Extract desired work categories
    desired_section = re.search(r'Ønsket arbeid:(.+?)(?:Åpen for|Kompetanse|Andre kommentarer|--)', body, re.DOTALL | re.IGNORECASE)
    if desired_section:
        work_text = desired_section.group(1)
        # Find all roles like "Category:Role" or "Category – Role"
        roles = re.findall(r'[-•]\s*([^:\n]+)(?::|–)\s*([^\n•-]+)', work_text)
        for category, role in roles:
            candidate.desired_work.append(f"{category.strip()}:{role.strip()}")
    
    # Extract competence/experience
    comp_match = re.search(r'Kompetanse(?:\s*og\s*erfaring)?:(.+?)(?:Andre kommentarer|--|$)', body, re.DOTALL | re.IGNORECASE)
    if comp_match:
        candidate.competence = comp_match.group(1).strip()
    
    # Extract comments
    comment_match = re.search(r'Andre kommentarer:\s*(.+?)(?:--|$)', body, re.DOTALL)
    if comment_match:
        comment = comment_match.group(1).strip()
        if comment and comment != '-':
            candidate.comments = comment
    
    # Only return if we have at least email
    if candidate.email:
        return candidate
    
    return None

def get_pool_slugs_for_candidate(candidate: CandidateFromEmail) -> List[str]:
    """Determine which pools a candidate should belong to based on desired work"""
    pools = set()
    
    for work in candidate.desired_work:
        # Parse "Category:Role" format
        parts = work.lower().split(':')
        role = parts[-1].strip() if parts else work.lower()
        
        # Check against our mapping
        for keyword, pool_slug in ROLE_TO_POOL.items():
            if keyword in role:
                pools.add(pool_slug)
                break
        else:
            # If no match found, check the full work string
            for keyword, pool_slug in ROLE_TO_POOL.items():
                if keyword in work.lower():
                    pools.add(pool_slug)
                    break
    
    return list(pools)

def parse_mbox_file(filepath: Path) -> List[CandidateFromEmail]:
    """Parse a single MBOX file and extract all candidates"""
    candidates = []
    
    print(f"Parsing: {filepath.name}")
    
    try:
        mbox = mailbox.mbox(str(filepath))
        
        for i, message in enumerate(mbox):
            try:
                # Get email date
                email_date = message.get('Date', '')
                
                # Get the body
                body = ''
                if message.is_multipart():
                    for part in message.walk():
                        content_type = part.get_content_type()
                        if content_type == 'text/plain':
                            payload = part.get_payload(decode=True)
                            if payload:
                                charset = part.get_content_charset() or 'utf-8'
                                try:
                                    body = payload.decode(charset, errors='ignore')
                                except:
                                    body = payload.decode('utf-8', errors='ignore')
                                break
                else:
                    payload = message.get_payload(decode=True)
                    if payload:
                        charset = message.get_content_charset() or 'utf-8'
                        try:
                            body = payload.decode(charset, errors='ignore')
                        except:
                            body = payload.decode('utf-8', errors='ignore')
                
                if body:
                    candidate = parse_email_body(body)
                    if candidate:
                        candidate.source_file = filepath.name
                        candidate.email_date = email_date
                        candidates.append(candidate)
                        
            except Exception as e:
                print(f"  Error parsing message {i}: {e}")
                
    except Exception as e:
        print(f"Error opening mbox {filepath}: {e}")
    
    print(f"  Found {len(candidates)} candidates")
    return candidates

def main():
    """Main function to parse all MBOX files"""
    
    takeout_path = Path(r"C:\Users\isakd\code\admincrew\Takeout\E-post")
    
    if not takeout_path.exists():
        print(f"Error: Path not found: {takeout_path}")
        return
    
    all_candidates = []
    
    # Parse each mbox file
    for mbox_file in takeout_path.glob("*.mbox"):
        candidates = parse_mbox_file(mbox_file)
        all_candidates.extend(candidates)
    
    print(f"\n{'='*60}")
    print(f"TOTAL: {len(all_candidates)} candidates found")
    print(f"{'='*60}\n")
    
    # Deduplicate by email (keep most recent)
    candidates_by_email = {}
    for c in all_candidates:
        if c.email:
            email_lower = c.email.lower()
            if email_lower not in candidates_by_email:
                candidates_by_email[email_lower] = c
            else:
                # Keep the one with more info
                existing = candidates_by_email[email_lower]
                if len(c.desired_work) > len(existing.desired_work):
                    candidates_by_email[email_lower] = c
    
    unique_candidates = list(candidates_by_email.values())
    print(f"Unique candidates (by email): {len(unique_candidates)}")
    
    # Analyze pool distribution
    pool_counts = {}
    for c in unique_candidates:
        pools = get_pool_slugs_for_candidate(c)
        for pool in pools:
            pool_counts[pool] = pool_counts.get(pool, 0) + 1
    
    print("\nPool distribution:")
    for pool, count in sorted(pool_counts.items(), key=lambda x: -x[1]):
        print(f"  {pool}: {count}")
    
    # Output to JSON for database update
    output_file = Path(__file__).parent / "candidates_from_emails.json"
    
    output_data = []
    for c in unique_candidates:
        data = asdict(c)
        data['suggested_pools'] = get_pool_slugs_for_candidate(c)
        output_data.append(data)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
    
    print(f"\nOutput saved to: {output_file}")
    
    # Show sample candidates
    print("\n" + "="*60)
    print("SAMPLE CANDIDATES:")
    print("="*60)
    for c in unique_candidates[:5]:
        print(f"\n{c.name} <{c.email}>")
        print(f"  Phone: {c.phone}")
        print(f"  Location: {c.city} ({c.postal_code})")
        print(f"  Desired: {', '.join(c.desired_work[:3])}")
        print(f"  Pools: {get_pool_slugs_for_candidate(c)}")

if __name__ == "__main__":
    main()

