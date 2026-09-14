const { execFileSync } = require('child_process');
let fehler = 0;
for (const t of ['core.test.js', 'feiertage.test.js', 'gsync.test.js', 'migration.test.js']) {
  try { execFileSync('node', [t], { stdio: 'pipe' }); console.log('bestanden  ' + t); }
  catch (e) { fehler++; console.log('FEHLER     ' + t); process.stdout.write(e.stdout.toString()); }
}
process.exit(fehler ? 1 : 0);
