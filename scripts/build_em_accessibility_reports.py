#!/usr/bin/env python3
import csv
import os
import re
from pathlib import Path

ORG = "tr-tax"
PROJECT = "taxProf"
ADO_URL = f"https://dev.azure.com/{ORG}/{PROJECT}/_workitems/edit/{{id}}"

# Parent → Category mapping for Batch 1
CLIENT_COMM_PARENTS = {3136758, 3107305}
WORKPAPERS_PARENTS = {3680361}

OUTPUT_BASE = Path("reports/em-a11y")
BY_CAT = OUTPUT_BASE / "by-category"
OUTPUT_BASE.mkdir(parents=True, exist_ok=True)
BY_CAT.mkdir(parents=True, exist_ok=True)

src_path = Path("data/Accessibility issues flat list (4).csv")
pattern = re.compile(
    r"ID:(?P<ID>\d+),\s+Title:(?P<Title>.*?),\s+Work Item Type:(?P<Type>.*?),\s+State:(?P<State>.*?),\s+Created By:(?P<CreatedBy>.*?),\s+Priority:(?P<Priority>.*?),\s+Story Points:(?P<SP>.*?),\s+Parent:(?P<Parent>\d+)$"
)

def derive_priority(title: str, raw_priority: str) -> int:
    m = re.search(r"\[(P[1-4])\]", title)
    if m:
        return int(m.group(1)[1])
    try:
        p = int(float(raw_priority))
        if p in (1,2,3,4):
            return p
    except Exception:
        pass
    return 3


def priority_group(p: int) -> str:
    return "P1/P2" if p in (1,2) else "P3/P4"


def categorize(parent_id: int) -> str | None:
    if parent_id in CLIENT_COMM_PARENTS:
        return "Client Communications"
    if parent_id in WORKPAPERS_PARENTS:
        return "Workpapers (incl. Workpaper Properties)"
    return None

rows = []
with open(src_path, "r", encoding="utf-8") as f:
    for line in f.read().splitlines():
        line = line.strip()
        if not line:
            continue
        m = pattern.match(line)
        if not m:
            # Skip malformed lines; optionally log
            continue
        d = m.groupdict()
        wid = int(d["ID"])
        parent = int(d["Parent"])
        title = d["Title"].strip()
        wtype = d["Type"].strip()
        state = d["State"].strip()
        created_by = d["CreatedBy"].strip()
        sp_raw = d["SP"].strip()
        try:
            sp = float(sp_raw)
        except Exception:
            sp = 0.0
        p = derive_priority(title, d["Priority"].strip())
        pg = priority_group(p)
        url = ADO_URL.format(id=wid)
        cat = categorize(parent)
        rec = {
            "Category": cat if cat else "",
            "Work Item ID": wid,
            "Title": title,
            "Type": wtype,
            "Priority": p,
            "Priority Group (P1/P2 or P3/P4)": pg,
            "Story Points": sp,
            "Created By": created_by,
            "State": state,
            "URL": url,
            "Description": "" if wtype.lower() == "user story" else "",
            "Steps to Reproduce": "" if wtype.lower() == "bug" else "",
            "Parent": parent,
        }
        rows.append(rec)

# Batch 1 filters
batch1 = [r for r in rows if r["Category"] in {
    "Client Communications",
    "Workpapers (incl. Workpaper Properties)",
}]

# Write by-category CSVs
cols = [
    "Category","Work Item ID","Title","Type","Priority","Priority Group (P1/P2 or P3/P4)",
    "Story Points","Created By","State","URL","Description","Steps to Reproduce"
]
from collections import defaultdict

by_cat = defaultdict(list)
for r in batch1:
    by_cat[r["Category"]].append(r)

for cat, items in by_cat.items():
    # sort: P1/P2 first, then P3/P4; keep relative ID order within group
    items_sorted = sorted(items, key=lambda x: (0 if x["Priority"] in (1,2) else 1, x["Work Item ID"]))
    outp = BY_CAT / f"{cat}.csv"
    with open(outp, "w", newline="", encoding="utf-8") as cf:
        writer = csv.DictWriter(cf, fieldnames=cols)
        writer.writeheader()
        for it in items_sorted:
            writer.writerow({k: it.get(k, "") for k in cols})

# Write master (Batch 1 subset)
master_p = OUTPUT_BASE / "master.csv"
with open(master_p, "w", newline="", encoding="utf-8") as cf:
    writer = csv.DictWriter(cf, fieldnames=cols)
    writer.writeheader()
    for it in sorted(batch1, key=lambda x: (x["Category"], x["Work Item ID"])):
        writer.writerow({k: it.get(k, "") for k in cols})

# Pivot summary for Batch 1
summary_cols = ["Category","Item Count","Total Story Points","P1/P2 SP Total","P3/P4 SP Total"]
summary_rows = []

def sums(items):
    count = len(items)
    total = sum(it["Story Points"] for it in items)
    p12 = sum(it["Story Points"] for it in items if it["Priority"] in (1,2))
    p34 = total - p12
    return count, total, p12, p34

grand_items = []
for cat in sorted(by_cat.keys()):
    items = by_cat[cat]
    c, t, p12, p34 = sums(items)
    summary_rows.append({
        "Category": cat,
        "Item Count": c,
        "Total Story Points": t,
        "P1/P2 SP Total": p12,
        "P3/P4 SP Total": p34,
    })
    grand_items.extend(items)

gc, gt, gp12, gp34 = sums(grand_items)
summary_rows.append({
    "Category": "Grand Total",
    "Item Count": gc,
    "Total Story Points": gt,
    "P1/P2 SP Total": gp12,
    "P3/P4 SP Total": gp34,
})

with open(OUTPUT_BASE / "pivot-summary.csv", "w", newline="", encoding="utf-8") as cf:
    writer = csv.DictWriter(cf, fieldnames=summary_cols)
    writer.writeheader()
    for s in summary_rows:
        writer.writerow(s)

print("Batch 1 CSVs generated under", OUTPUT_BASE)
