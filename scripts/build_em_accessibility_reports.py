#!/usr/bin/env python3
import re, os, csv, sys
from collections import defaultdict

INPUT_PATH = 'data/Accessibility issues flat list (4).csv'
OUT_DIR = 'reports/em-a11y'
CATEGORY_DIR = os.path.join(OUT_DIR, 'by-category')
ADO_URL_TMPL = 'https://dev.azure.com/tr-tax/taxProf/_workitems/edit/{id}'

COMMUNICATION_PARENTS = {3136758, 3107305}
WORKPAPERS_PARENT = 3680361

header = ['Category','Work Item ID','Title','Type','Priority','Priority Group','Story Points','Created By','State','URL','Description','Steps to Reproduce']

pattern = re.compile(r'^ID:(?P<id>\d+),\s+Title:(?P<title>.*?),\s+Work Item Type:(?P<wit>[^,]+),\s+State:(?P<state>[^,]+),\s+Created By:(?P<created>.*?),\s+Priority:(?P<priority>[^,]+),\s+Story Points:(?P<sp>\d+),\s+Parent:(?P<parent>\d+)')

rows = []
with open(INPUT_PATH, 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        m = pattern.match(line)
        if not m:
            print(f'WARN: Failed to parse line: {line[:120]}...', file=sys.stderr)
            continue
        d = m.groupdict()
        id_ = int(d['id'])
        title = d['title']
        wit = d['wit']
        state = d['state']
        created = d['created']
        prio_raw = d['priority']
        sp = int(d['sp'])
        parent = int(d['parent'])
        # infer category for Batch 1 only
        if parent in COMMUNICATION_PARENTS:
            category = 'Client Communications'
        elif parent == WORKPAPERS_PARENT:
            category = 'Workpapers (incl. Workpaper Properties)'
        else:
            # skip non-batch-1 rows now
            continue
        # derive priority
        ptag = re.search(r'\[P([1-4])\]', title)
        if ptag:
            priority = int(ptag.group(1))
        else:
            try:
                priority = int(prio_raw)
            except:
                priority = 3
        pgroup = 'P1/P2' if priority in (1,2) else 'P3/P4'
        url = ADO_URL_TMPL.format(id=id_)
        desc = '' if wit != 'User Story' else ''
        steps = '' if wit != 'Bug' else ''
        rows.append([category, id_, title, wit, priority, pgroup, sp, created, state, url, desc, steps])

# ensure output dirs
os.makedirs(CATEGORY_DIR, exist_ok=True)

# group by category and priority group order
def sort_key(r):
    return (0 if r[5]=='P1/P2' else 1, r[1])

by_cat = defaultdict(list)
for r in rows:
    by_cat[r[0]].append(r)

# write by-category files
for cat, items in by_cat.items():
    items_sorted = sorted(items, key=sort_key)
    fname = f'{cat}.csv'
    path = os.path.join(CATEGORY_DIR, fname)
    with open(path, 'w', encoding='utf-8', newline='') as out:
        w = csv.writer(out)
        w.writerow(header)
        w.writerows(items_sorted)

# write master (batch 1 subset)
master_path = os.path.join(OUT_DIR, 'master.csv')
with open(master_path, 'w', encoding='utf-8', newline='') as out:
    w = csv.writer(out)
    w.writerow(header)
    for cat in sorted(by_cat.keys()):
        for r in sorted(by_cat[cat], key=sort_key):
            w.writerow(r)

# pivot summary for batch 1
summary_header = ['Category','Items','Total SP','P1/P2 SP','P3/P4 SP']
summary_rows = []
for cat, items in sorted(by_cat.items()):
    total_sp = sum(i[6] for i in items)
    p12_sp = sum(i[6] for i in items if i[5]=='P1/P2')
    p34_sp = total_sp - p12_sp
    summary_rows.append([cat, len(items), total_sp, p12_sp, p34_sp])

# grand totals
gt_items = sum(len(v) for v in by_cat.values())
gt_sp = sum(sum(i[6] for i in v) for v in by_cat.values())
gt_p12 = sum(sum(i[6] for i in v if i[5]=='P1/P2') for v in by_cat.values())
gt_p34 = gt_sp - gt_p12

pivot_path = os.path.join(OUT_DIR, 'pivot-summary.csv')
with open(pivot_path, 'w', encoding='utf-8', newline='') as out:
    w = csv.writer(out)
    w.writerow(summary_header)
    w.writerows(summary_rows)
    w.writerow(['Grand Total', gt_items, gt_sp, gt_p12, gt_p34])

print(f'Wrote: {master_path}')
for cat in by_cat:
    print(f'Wrote: {os.path.join(CATEGORY_DIR, cat + ".csv")}')
print(f'Wrote: {pivot_path}')
