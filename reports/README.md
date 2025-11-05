EM Accessibility Reports

This folder contains auto-generated reports from the Engagement Manager accessibility issues list.

Files
- reports/em-a11y/master.csv — all items with categorization and ADO URLs
- reports/em-a11y/by-category/*.csv — one CSV per category
- reports/em-a11y/pivot-summary.csv — running totals (Batch 1 includes Client Communications and Workpapers)

Category mapping (by Parent feature ID)
- Client Communications: Parent in {3136758, 3107305}
- Workpapers (incl. Workpaper Properties): Parent == 3680361
- Add/Edit/Delete Engagement (incl. Engagement Properties): Parent == 3068226
- Journal Entries: Parent in {3813499, 3306472}
- Manage Users: Parent == 3677319
- Dashboard/Home/Status: Parent == 3677320
- Trial Balance: Parent == 4553113
- Setup: Parent == 4553053 OR Title contains [Setup panel] or [Help and support]
- Header and Notifications: Parent == 3568023 (unless Setup/Links/Notifications match overrides)
- Links: Title contains [External links]
- Other: fallback

Priority handling
- Priority parsed from title tokens [P1]/[P2]/[P3]/[P4] when present; otherwise defaults to 3
- Priority Group derived as P1/P2 if priority in {1,2}, else P3/P4

Columns
- Category, Work Item ID, Title, Type, Priority, Priority Group (P1/P2 or P3/P4), Story Points, Created By, State, URL, Description (User Story), Steps to Reproduce (Bug)
