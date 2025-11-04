# Merge ADO CSVs via GitHub Actions

This repo contains two input files and a workflow that creates an import-safe merged CSV for Azure DevOps.

Inputs expected at repo root:
- Accessibility issues flat list (3).csv OR Accessibility issues flat list.csv
- ado-bulk-update-with-sp-import.csv OR ado-bulk-update-with-sp.csv

Output generated:
- merged/ado-merged.csv (7 columns, quoted/escaped suitable for ADO import)

How to run
1. Push to the branch `data/ado-merge-actions` (or use Actions -> "Merge ADO CSVs" -> Run workflow)
2. Wait for the job to finish. It will commit `merged/ado-merged.csv` back to the same branch.
3. Download `merged/ado-merged.csv` and import into Azure DevOps.

Column order (must be exact for ADO import)
- ID
- Title
- Work Item Type
- System.AreaPath
- System.IterationPath
- Microsoft.VSTS.Common.Priority
- Microsoft.VSTS.Scheduling.StoryPoints

Merge rules
- Uses Title and Work Item Type from Accessibility issues flat list*.csv
- Uses AreaPath/IterationPath/Priority/StoryPoints from ado-bulk-update-with-sp*.csv
- Treats the string `nan` (any case) as blank
- Normalizes Story Points to integer if whole (e.g., 5.0 -> 5)
- Uses Python csv module to correctly quote and escape commas and quotes in Titles

Troubleshooting
- If you see: "Excess number of field values found", ensure you are importing the generated `merged/ado-merged.csv` and not a hand-edited version.
- If a source file is missing, the workflow tries both possible names shown above.
