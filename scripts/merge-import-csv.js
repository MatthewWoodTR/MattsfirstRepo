const fs = require('fs');
const path = require('path');

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  const header = lines.shift();
  const cols = header.split(',').map(h => h.trim());
  return lines.map(line => {
    // naive split; acceptable for our simple CSVs without embedded commas in fields
    const vals = line.split(',');
    const obj = {};
    cols.forEach((c, i) => obj[c] = (vals[i] ?? '').trim());
    return obj;
  });
}

const root = process.cwd();
const sourcePath = fs.existsSync(path.join(root, 'Accessibility issues flat list.csv'))
  ? path.join(root, 'Accessibility issues flat list.csv')
  : fs.readdirSync(root).find(f => f.startsWith('Accessibility issues flat list') && f.endsWith('.csv'));
const updatesPath = path.join(root, 'ado-bulk-update-with-sp.csv');

if (!sourcePath || !fs.existsSync(sourcePath)) {
  console.error('Source CSV not found. Place "Accessibility issues flat list.csv" at repo root.');
  process.exit(1);
}
if (!fs.existsSync(updatesPath)) {
  console.error('Update CSV not found: ado-bulk-update-with-sp.csv');
  process.exit(1);
}

const sourceText = fs.readFileSync(sourcePath, 'utf8');
const updateText = fs.readFileSync(updatesPath, 'utf8');

const source = parseCSV(sourceText);
const updates = parseCSV(updateText);

// Build maps by ID
const srcById = new Map();
for (const r of source) {
  const id = (r.ID || r['ID']).trim();
  if (!id) continue;
  srcById.set(id, r);
}

const outHeader = [
  'ID',
  'System.Title',
  'System.WorkItemType',
  'System.AreaPath',
  'System.IterationPath',
  'Microsoft.VSTS.Common.Priority',
  'Microsoft.VSTS.Scheduling.StoryPoints'
];

const outRows = [outHeader.join(',')];

for (const u of updates) {
  const id = (u.ID || u['ID']).trim();
  if (!id) continue;
  const s = srcById.get(id);
  if (!s) continue; // only include items that are in source list

  const title = (s.Title || s['System.Title'] || '').replace(/\r?\n/g, ' ').replace(/,/g, ' ');
  const type = (s['Work Item Type'] || s['System.WorkItemType'] || '').trim();

  const area = (u.AreaPath || u['System.AreaPath'] || '').trim();
  const iter = (u.IterationPath || u['System.IterationPath'] || '').trim();
  const pri = (u.Priority || u['Microsoft.VSTS.Common.Priority'] || '').trim();
  const sp = (u['Microsoft.VSTS.Scheduling.StoryPoints'] || u['Story Points'] || '').toString().trim();

  const row = [
    id,
    title,
    type,
    area,
    iter,
    pri,
    sp
  ].join(',');
  outRows.push(row);
}

fs.writeFileSync(path.join(root, 'ado-bulk-update-with-sp-import.csv'), outRows.join('\n'), 'utf8');
console.log('Wrote ado-bulk-update-with-sp-import.csv with', outRows.length - 1, 'rows.');
