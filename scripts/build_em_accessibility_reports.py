#!/usr/bin/env python3
import os, re, csv, sys, pathlib
from collections import defaultdict

# Inputs
ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA_FILE = ROOT / 'data' / 'Accessibility issues flat list (4).csv'
OUT_DIR = ROOT / 'reports' / 'em-a11y'
BY_CAT_DIR = OUT_DIR / 'by-category'

ADO_URL_FMT = 'https://dev.azure.com/tr-tax/taxProf/_workitems/edit/{id}'

# Categories for Batch 1 only
CATEGORIES = {
    'Client Communications': {3136758, 3107305},
    'Workpapers (incl. Workpaper Properties)': {3680361},
}

# Helpers
priority_from_title_re = re.compile(r'\[(P[1-4])\]')

def derive_priority(title: str, raw_priority: str) -> int:
    m = priority_from_title_re.search(title or '')
    if m:
        return int(m.group(1)[1])
    try:
        p = int(raw_priority)
        if p in (1,2,3,4):
            return p
    except Exception:
        pass
    return 3

def priority_group(p: int) -> str:
    return 'P1/P2' if p in (1,2) else 'P3/P4'

def parse_line(line: str):
    # Robust token-based parsing using field markers rather than comma splitting
    # Expected markers present in each line
    # ID:<id>, Title:<title>, Work Item Type:<type>, State:<state>, Created By:<created_by>, Priority:<prio>, Story Points:<sp>, Parent:<parent>
    fields = {}
    # Use non-greedy capture up to next marker
    patterns = {
        'ID': r'ID:(?P<ID>\d+)',
        'Title': r'Title:(?P<Title>.*?),\s+Work Item Type:',
        'Work Item Type': r'Work Item Type:(?P<WorkItemType>.*?),\s+State:',
        'State': r'State:(?P<State>.*?),\s+Created By:',
        'Created By': r'Created By:(?P<CreatedBy>.*?),\s+Priority:',
        'Priority': r'Priority:(?P<Priority>[^,]*),\s+Story Points:',
        'Story Points': r'Story Points:(?P<StoryPoints>[^,]*),\s+Parent:',
        'Parent': r'Parent:(?P<Parent>\d+)(?:\s*$)',
    }
    try:
        # ID
        m = re.search(patterns['ID'], line)
        if not m:
            return None
        fields['ID'] = int(m.group('ID'))
        # Title through Parent with chained regex
        for key in ['Title','Work Item Type','State','Created By','Priority','Story Points','Parent']:
            m = re.search(patterns[key], line)
            if not m:
                raise ValueError(f'Missing field {key}')
            grp = m.groupdict()
            if key == 'Work Item Type':
                fields['Work Item Type'] = grp['WorkItemType'].strip()
            elif key == 'Created By':
                fields['Created By'] = grp['CreatedBy'].strip()
            elif key == 'Story Points':
                sp_raw = grp['StoryPoints'].strip()
                fields['Story Points'] = float(sp_raw) if sp_raw and sp_raw.lower() != 'nan' else None
            elif key == 'Priority':
                pr_raw = grp['Priority'].strip()
                fields['Priority'] = pr_raw if pr_raw else 'nan'
            elif key == 'Parent':
                fields['Parent'] = int(grp['Parent'])
            else:
                fields[key] = grp[key].strip()
        return fields
    except Exception as e:
        raise ValueError(f'Failed to parse line: {line[:200]}...\n{e}')


def categorize(parent_id: int) -> str | None:
    for cat, ids in CATEGORIES.items():
        if parent_id in ids:
            return cat
    return None


def main():
    if not DATA_FILE.exists():
        print(f'Input file not found: {DATA_FILE}', file=sys.stderr)
        sys.exit(1)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    BY_CAT_DIR.mkdir(parents=True, exist_ok=True)

    rows = []
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        for raw in f:
            raw = raw.strip()
            if not raw:
                continue
            if not raw.startswith('ID:'):
                continue
            rec = parse_line(raw)
            if not rec:
                continue
            # Derive fields
            cat = categorize(rec['Parent'])
            if not cat:
                # Skip non-Batch1 categories in this run
                continue
            p = derive_priority(rec['Title'], rec.get('Priority',''))
            group = priority_group(p)
            sp = rec.get('Story Points') or 0.0
            url = ADO_URL_FMT.format(id=rec['ID'])

            out = {
                'Category': cat,
                'Work Item ID': rec['ID'],
                'Title': rec['Title'],
                'Type': rec['Work Item Type'],
                'Priority': p,
                'Priority Group (P1/P2 or P3/P4)': group,
                'Story Points': sp,
                'Created By': rec['Created By'],
                'State': rec['State'],
                'URL': url,
                'Description': '' if rec['Work Item Type'].lower() == 'user story' else '',
                'Steps to Reproduce': '' if rec['Work Item Type'].lower() == 'bug' else '',
            }
            rows.append(out)

    # Write per-category files with grouping
    headers = ['Category','Work Item ID','Title','Type','Priority','Priority Group (P1/P2 or P3/P4)','Story Points','Created By','State','URL','Description','Steps to Reproduce']

    by_category = defaultdict(list)
    for r in rows:
        by_category[r['Category']].append(r)

    # Sort P1/P2 first then P3/P4, then by ID for stability
    def sort_key(r):
        return (0 if r['Priority'] in (1,2) else 1, r['Work Item ID'])

    for cat, items in by_category.items():
        items.sort(key=sort_key)
        out_path = BY_CAT_DIR / (f'{cat}.csv')
        with open(out_path, 'w', newline='', encoding='utf-8') as f:
            w = csv.DictWriter(f, fieldnames=headers)
            w.writeheader()
            w.writerows(items)

    # Write master (Batch1 subset only)
    master_path = OUT_DIR / 'master.csv'
    rows_sorted = sorted(rows, key=lambda r: (r['Category'], 0 if r['Priority'] in (1,2) else 1, r['Work Item ID']))
    with open(master_path, 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=headers)
        w.writeheader()
        w.writerows(rows_sorted)

    # Pivot summary for Batch 1 categories
    pivot_headers = ['Category','Item Count','Total SP','P1/P2 SP total','P3/P4 SP total']
    pivot_rows = []
    for cat in CATEGORIES.keys():
        items = by_category.get(cat, [])
        count = len(items)
        total_sp = sum(r['Story Points'] or 0 for r in items)
        p12_sp = sum((r['Story Points'] or 0) for r in items if r['Priority'] in (1,2))
        p34_sp = total_sp - p12_sp
        pivot_rows.append({'Category': cat, 'Item Count': count, 'Total SP': total_sp, 'P1/P2 SP total': p12_sp, 'P3/P4 SP total': p34_sp})

    # Grand totals
    grand_count = sum(r['Item Count'] for r in pivot_rows)
    grand_total_sp = sum(r['Total SP'] for r in pivot_rows)
    grand_p12 = sum(r['P1/P2 SP total'] for r in pivot_rows)
    grand_p34 = sum(r['P3/P4 SP total'] for r in pivot_rows)
    pivot_rows.append({'Category': 'Grand Total', 'Item Count': grand_count, 'Total SP': grand_total_sp, 'P1/P2 SP total': grand_p12, 'P3/P4 SP total': grand_p34})

    with open(OUT_DIR / 'pivot-summary.csv', 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=pivot_headers)
        w.writeheader()
        w.writerows(pivot_rows)

    print(f'Wrote {len(rows)} items to {master_path}')
    for cat in by_category:
        print(f'- {cat}: {len(by_category[cat])} items')

if __name__ == '__main__':
    main()
