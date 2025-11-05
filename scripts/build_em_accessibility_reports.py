#!/usr/bin/env python3
import csv, os, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT/"data"/"Accessibility issues flat list (4).csv"
OUT_DIR = ROOT/"reports"/"em-a11y"
BY_CAT_DIR = OUT_DIR/"by-category"

CLIENT_COMM_PARENTS = {3136758, 3107305}
WORKPAPERS_PARENTS = {3680361}

ADO_URL = "https://dev.azure.com/tr-tax/taxProf/_workitems/edit/{id}"

PAIR_RE = re.compile(r"(ID|Title|Work Item Type|State|Created By|Priority|Story Points|Parent):\s*(.*?)(?=,\s*(?:ID|Title|Work Item Type|State|Created By|Priority|Story Points|Parent):|$)")
PRIORITY_IN_TITLE = re.compile(r"\[(P[1-4])\]")

COLUMNS = [
  "Category","Work Item ID","Title","Type","Priority","Priority Group","Story Points","Created By","State","URL","Description","Steps to Reproduce"
]

def parse_lines(path: Path):
    rows = []
    with path.open("r", encoding="utf-8") as f:
        for ln, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            m = dict(PAIR_RE.findall(line))
            if not m:
                # Allow comments or accidental lines
                print(f"WARN: Failed to parse line {ln}: {line[:120]}", file=sys.stderr)
                continue
            try:
                rid = int(m.get("ID", "").strip())
            except ValueError:
                print(f"WARN: Bad ID at line {ln}: {m.get('ID')}", file=sys.stderr)
                continue
            title = m.get("Title", "").strip()
            wtype = m.get("Work Item Type", "").strip()
            state = m.get("State", "").strip()
            created_by = m.get("Created By", "").strip()
            parent = int(m.get("Parent", "0").strip() or 0)
            # story points
            sp_raw = (m.get("Story Points", "") or "").strip()
            try:
                sp = int(float(sp_raw)) if sp_raw else 0
            except ValueError:
                sp = 0
            # priority
            pr_raw = (m.get("Priority", "") or "").strip().lower()
            pr = None
            mt = PRIORITY_IN_TITLE.search(title)
            if mt:
                pr = int(mt.group(1)[1])  # P1->1
            else:
                if pr_raw in ("", "nan", "none", "null"):
                    pr = 3
                else:
                    try:
                        pr = int(float(pr_raw))
                    except ValueError:
                        pr = 3
            pr_group = "P1/P2" if pr in (1,2) else "P3/P4"
            url = ADO_URL.format(id=rid)
            rows.append({
              "Work Item ID": rid,
              "Title": title,
              "Type": wtype,
              "Priority": pr,
              "Priority Group": pr_group,
              "Story Points": sp,
              "Created By": created_by,
              "State": state,
              "URL": url,
              "Parent": parent,
              "Description": "" if wtype != "User Story" else "",
              "Steps to Reproduce": "" if wtype != "Bug" else "",
            })
    return rows


def category_for_parent(pid: int):
    if pid in CLIENT_COMM_PARENTS:
        return "Client Communications"
    if pid in WORKPAPERS_PARENTS:
        return "Workpapers (incl. Workpaper Properties)"
    return None  # not part of Batch 1


def write_csv(path: Path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLUMNS)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in COLUMNS})


def grouped_and_sorted(rows):
    # P1/P2 first, then P3/P4
    g1 = [r for r in rows if r["Priority Group"] == "P1/P2"]
    g2 = [r for r in rows if r["Priority Group"] == "P3/P4"]
    # stable sort by Priority then ID
    g1.sort(key=lambda r: (r["Priority"], r["Work Item ID"]))
    g2.sort(key=lambda r: (r["Priority"], r["Work Item ID"]))
    return g1 + g2


def totals(rows):
    count = len(rows)
    sp_total = sum(r.get("Story Points",0) or 0 for r in rows)
    sp_p12 = sum((r.get("Story Points",0) or 0) for r in rows if r.get("Priority") in (1,2))
    sp_p34 = sp_total - sp_p12
    return count, sp_total, sp_p12, sp_p34


def main():
    rows = parse_lines(SRC)
    # Derive categories for batch 1
    batch1 = []
    for r in rows:
        cat = category_for_parent(r.get("Parent"))
        if not cat:
            continue
        out = {**r}
        out["Category"] = cat
        batch1.append(out)

    # Write per-category files
    cats = {}
    for r in batch1:
        cats.setdefault(r["Category"], []).append(r)

    for cat, rs in cats.items():
        rs_sorted = grouped_and_sorted(rs)
        safe_name = cat.replace("/", "-")
        write_csv(BY_CAT_DIR/f"{safe_name}.csv", rs_sorted)

    # Master (batch-1 subset)
    master_sorted = grouped_and_sorted(batch1)
    write_csv(OUT_DIR/"master.csv", master_sorted)

    # Pivot summary for batch 1 categories
    pivot_rows = []
    grand_cnt = grand_sp = grand_p12 = grand_p34 = 0
    for cat, rs in sorted(cats.items()):
        cnt, sp, p12, p34 = totals(rs)
        pivot_rows.append({
            "Category": cat,
            "Items": cnt,
            "Total Story Points": sp,
            "P1/P2 SP": p12,
            "P3/P4 SP": p34,
        })
        grand_cnt += cnt; grand_sp += sp; grand_p12 += p12; grand_p34 += p34

    # Write pivot
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    with (OUT_DIR/"pivot-summary.csv").open("w", newline="", encoding="utf-8") as f:
        hdr = ["Category","Items","Total Story Points","P1/P2 SP","P3/P4 SP"]
        w = csv.DictWriter(f, fieldnames=hdr)
        w.writeheader()
        for r in pivot_rows:
            w.writerow(r)
        w.writerow({
            "Category": "Grand Total (Batch 1)",
            "Items": grand_cnt,
            "Total Story Points": grand_sp,
            "P1/P2 SP": grand_p12,
            "P3/P4 SP": grand_p34,
        })

if __name__ == "__main__":
    sys.exit(main())
