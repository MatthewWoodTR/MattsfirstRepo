name: Merge ADO CSVs

on:
  workflow_dispatch:
    inputs:
      branch:
        description: Branch to run on
        required: false
        default: data/ado-merge-actions
  push:
    branches:
      - data/ado-merge-actions
    paths:
      - "Accessibility issues flat list.csv"
      - "Accessibility issues flat list (3).csv"
      - "ado-bulk-update-with-sp.csv"
      - "ado-bulk-update-with-sp-import.csv"
      - ".github/workflows/merge-ado-csv.yml"

permissions:
  contents: write

concurrency:
  group: merge-ado-${{ github.ref }}
  cancel-in-progress: true

jobs:
  merge:
    runs-on: ubuntu-latest
    steps:
      - name: Resolve branch
        id: resolve
        run: |
          if [ -n "${{ github.event.inputs.branch }}" ]; then
            echo "branch=${{ github.event.inputs.branch }}" >> "$GITHUB_OUTPUT"
          else
            echo "branch=${GITHUB_REF_NAME}" >> "$GITHUB_OUTPUT"
          fi

      - name: Checkout branch with full history
        uses: actions/checkout@v4
        with:
          ref: ${{ steps.resolve.outputs.branch }}
          fetch-depth: 0
          persist-credentials: true

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Generate merged CSV
        run: |
          python - <<'PY'
          import csv, os, re
          from pathlib import Path

          # Inputs (fallback-aware)
          repo = Path(".")
          titles = (
              repo / "Accessibility issues flat list (3).csv"
              if (repo / "Accessibility issues flat list (3).csv").exists()
              else repo / "Accessibility issues flat list.csv"
          )
          attrs = (
              repo / "ado-bulk-update-with-sp-import.csv"
              if (repo / "ado-bulk-update-with-sp-import.csv").exists()
              else repo / "ado-bulk-update-with-sp.csv"
          )
          out_file = repo / "merged" / "ado-merged.csv"

          OUT_HEADERS = [
              "ID",
              "Title",
              "Work Item Type",
              "System.AreaPath",
              "System.IterationPath",
              "Microsoft.VSTS.Common.Priority",
              "Microsoft.VSTS.Scheduling.StoryPoints",
          ]

          def clean(val):
              if val is None:
                  return ""
              s = str(val).strip()
              return "" if s.lower() == "nan" else s

          def norm_sp(val):
              s = clean(val)
              if s == "":
                  return ""
              try:
                  f = float(s)
                  return str(int(f)) if f.is_integer() else str(f).rstrip("0").rstrip(".")
              except Exception:
                  return ""

          def is_csv(path: Path) -> bool:
              # Simple heuristic: treat as CSV if header contains commas and not "ID:" style
              head = path.read_text(encoding="utf-8-sig", errors="ignore").splitlines()[:2]
              if not head:
                  return False
              line = head[0]
              return ("," in line) and (":" not in line.split(",")[0])

          def parse_titles(path: Path):
              result = {}
              text = path.read_text(encoding="utf-8-sig", errors="ignore")
              # If it's the key:value style, convert to Dicts
              if not is_csv(path):
                  for raw in filter(None, text.splitlines()):
                      # Example: ID:2715757, Title:..., Work Item Type:Bug, ...
                      parts = [p.strip() for p in raw.split(",")]
                      row = {}
                      for p in parts:
                          if ":" in p:
                              k, v = p.split(":", 1)
                              row[k.strip()] = v.strip()
                      id_ = clean(row.get("ID"))
                      if not id_:
                          continue
                      result[id_] = {
                          "ID": id_,
                          "Title": clean(row.get("Title")),
                          "Work Item Type": clean(row.get("Work Item Type")),
                      }
                  return result
              # Proper CSV
              lines = text.splitlines()
              # Let csv handle quoted fields
              r = csv.DictReader(lines)
              for row in r:
                  id_ = clean(row.get("ID"))
                  if not id_:
                      continue
                  result[id_] = {
                      "ID": id_,
                      "Title": clean(row.get("Title")),
                      "Work Item Type": clean(row.get("Work Item Type")),
                  }
              return result

          def parse_attrs(path: Path):
              result = {}
              text = path.read_text(encoding="utf-8-sig", errors="ignore")
              # Support key:value style as pasted in chat
              if not is_csv(path):
                  for raw in filter(None, text.splitlines()):
                      parts = [p.strip() for p in raw.split(",")]
                      row = {}
                      for p in parts:
                          if ":" in p:
                              k, v = p.split(":", 1)
                              row[k.strip()] = v.strip()
                      id_ = clean(row.get("ID"))
                      if not id_:
                          continue
                      result[id_] = {
                          "System.AreaPath": clean(row.get("System.AreaPath")),
                          "System.IterationPath": clean(row.get("System.IterationPath")),
                          "Microsoft.VSTS.Common.Priority": clean(row.get("Microsoft.VSTS.Common.Priority")),
                          "Microsoft.VSTS.Scheduling.StoryPoints": norm_sp(row.get("Microsoft.VSTS.Scheduling.StoryPoints")),
                      }
                  return result
              # Proper CSV
              lines = text.splitlines()
              r = csv.DictReader(lines)
              # Column name variations tolerance
              def getv(row, *names):
                  for n in names:
                      if n in row:
                          return row.get(n)
                  return None
              for row in r:
                  id_ = clean(getv(row, "ID", "Id"))
                  if not id_:
                      continue
                  result[id_] = {
                      "System.AreaPath": clean(getv(row, "System.AreaPath", "AreaPath")),
                      "System.IterationPath": clean(getv(row, "System.IterationPath", "IterationPath")),
                      "Microsoft.VSTS.Common.Priority": clean(getv(row, "Microsoft.VSTS.Common.Priority", "Priority")),
                      "Microsoft.VSTS.Scheduling.StoryPoints": norm_sp(getv(row, "Microsoft.VSTS.Scheduling.StoryPoints", "Story Points", "StoryPoints")),
                  }
              return result

          if not titles.exists():
              raise SystemExit(f"Missing titles file: {titles}")
          if not attrs.exists():
              raise SystemExit(f"Missing attributes file: {attrs}")

          titles_map = parse_titles(titles)
          attrs_map = parse_attrs(attrs)

          out_file.parent.mkdir(parents=True, exist_ok=True)
          with out_file.open("w", newline="", encoding="utf-8") as f:
              w = csv.DictWriter(f, fieldnames=OUT_HEADERS, quoting=csv.QUOTE_MINIMAL)
              w.writeheader()
              for id_, t in titles_map.items():
                  a = attrs_map.get(id_, {})
                  row = {
                      "ID": t["ID"],
                      "Title": t["Title"],
                      "Work Item Type": t["Work Item Type"],
                      "System.AreaPath": a.get("System.AreaPath", ""),
                      "System.IterationPath": a.get("System.IterationPath", ""),
                      "Microsoft.VSTS.Common.Priority": a.get("Microsoft.VSTS.Common.Priority", ""),
                      "Microsoft.VSTS.Scheduling.StoryPoints": a.get("Microsoft.VSTS.Scheduling.StoryPoints", ""),
                  }
                  # Clean one more time to eliminate 'nan'
                  for k, v in list(row.items()):
                      row[k] = "" if str(v).strip().lower() == "nan" else v
                  w.writerow(row)
          PY

      - name: Set git identity
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

      - name: Commit changes (if any)
        run: |
          if [[ -n "$(git status --porcelain)" ]]; then
            git add merged/ado-merged.csv
            git commit -m "Generate import-safe merged CSV"
          else
            echo "No changes to commit."
          fi

      - name: Rebase and push safely
        env:
          BRANCH_NAME: ${{ steps.resolve.outputs.branch }}
        run: |
          # Only push if we have local commits ahead of remote
          if [[ -n "$(git log origin/${BRANCH_NAME}..HEAD)" ]]; then
            git fetch origin ${BRANCH_NAME}
            # Attempt rebase on top of the latest remote
            if ! git pull --rebase origin ${BRANCH_NAME}; then
              echo "Rebase failed; attempting force-with-lease push as last resort."
            fi
            # Try normal push first
            if ! git push origin HEAD:${BRANCH_NAME}; then
              git push --force-with-lease origin HEAD:${BRANCH_NAME}
            fi
          else
            echo "No new commits to push."
          fi
