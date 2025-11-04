import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC_A = ROOT / "Accessibility issues flat list.csv"
SRC_B = ROOT / "ado-bulk-update-with-sp.csv"
OUT = ROOT / "merged" / "ado-merged.csv"

# Output header expected by ADO import
HEADER = [
    "ID",
    "Title",
    "Work Item Type",
    "System.AreaPath",
    "System.IterationPath",
    "Microsoft.VSTS.Common.Priority",
    "Microsoft.VSTS.Scheduling.StoryPoints",
]


def read_csv_a(path: Path):
    rows = {}
    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            # Normalize ID as string without quotes/spaces
            id_ = r.get("ID", "").strip().strip("\"")
            if not id_:
                continue
            rows[id_] = {
                "ID": id_,
                "Title": (r.get("Title", "") or "").strip(),
                "Work Item Type": (r.get("Work Item Type", "") or "").strip(),
            }
    return rows


def read_csv_b(path: Path):
    rows = {}
    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            id_ = (r.get("ID") or "").strip()
            if not id_:
                continue
            area = (r.get("AreaPath") or r.get("System.AreaPath") or "").strip()
            iterp = (r.get("IterationPath") or r.get("System.IterationPath") or "").strip()
            prio = (r.get("Priority") or r.get("Microsoft.VSTS.Common.Priority") or "").strip()
            sp = (r.get("Microsoft.VSTS.Scheduling.StoryPoints") or r.get("StoryPoints") or "").strip()
            # Treat 'nan' or empty as blank
            def norm(v):
                return "" if v.lower() == "nan" else v
            area, iterp, prio, sp = map(norm, [area, iterp, prio, sp])
            # Normalize SP to int if whole number
            if sp:
                try:
                    spf = float(sp)
                    if spf.is_integer():
                        sp = str(int(spf))
                    else:
                        sp = str(spf)
                except Exception:
                    pass
            rows[id_] = {
                "System.AreaPath": area,
                "System.IterationPath": iterp,
                "Microsoft.VSTS.Common.Priority": prio,
                "Microsoft.VSTS.Scheduling.StoryPoints": sp,
            }
    return rows


def main():
    a = read_csv_a(SRC_A)
    b = read_csv_b(SRC_B)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=HEADER, quoting=csv.QUOTE_MINIMAL)
        writer.writeheader()
        for id_ in a:
            left = a[id_]
            right = b.get(id_, {})
            row = {
                "ID": left["ID"],
                "Title": left["Title"],
                "Work Item Type": left["Work Item Type"],
                "System.AreaPath": right.get("System.AreaPath", ""),
                "System.IterationPath": right.get("System.IterationPath", ""),
                "Microsoft.VSTS.Common.Priority": right.get("Microsoft.VSTS.Common.Priority", ""),
                "Microsoft.VSTS.Scheduling.StoryPoints": right.get("Microsoft.VSTS.Scheduling.StoryPoints", ""),
            }
            writer.writerow(row)


if __name__ == "__main__":
    main()
