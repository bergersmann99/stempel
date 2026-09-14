// Prueft, dass Daten aus Fassung 1 verlustfrei nach Fassung 2 wandern.
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync('index.html', 'utf8');
const js = html.match(/<script>\n([\s\S]*?)<\/script>\n<\/body>/)[1];
// Nur die Zustandsverwaltung herausloesen, ohne DOM-Teil
const teil = js.slice(js.indexOf('var SCHLUESSEL'), js.indexOf('/* ---------- Kernlogik'));

let fails = 0;
function eq(a, e, l) { const ok = a === e; if (!ok) fails++; console.log((ok ? 'ok  ' : 'FAIL') + '  ' + l + '  got=' + JSON.stringify(a) + ' want=' + JSON.stringify(e)); }

function ladeMit(gespeichert) {
  const ctx = {
    window: {},
    Speicher: { lies: () => gespeichert === null ? null : JSON.stringify(gespeichert), schreib: () => {}, dauerhaft: true },
    Number, JSON, Date, Object, Array, console
  };
  vm.createContext(ctx);
  vm.runInContext(teil + '\n; var __S = laden();', ctx);
  return ctx.__S;
}

// Leerer Start
let s = ladeMit(null);
eq(s.v, 2, 'leerer Start liefert Fassung 2');
eq(s.aktuell, 'synera', 'Synera ist voreingestellt');
eq(s.jobs.synera.sollMin, 480, 'Synera mit 8 Stunden');
eq(s.jobs.kinelense.sollMin, 0, 'Kinelense ohne Sollzeit');
eq(s.jobs.kiwerkstatt.name, 'KI-Werkstatt', 'dritter Job vorhanden');

// Fassung 1 mit laufender Schicht und eigenen Einstellungen
s = ladeMit({
  v: 1,
  aktiv: { date: '2026-09-14', startMin: 500 },
  eintraege: [{ id: 'x', date: '2026-09-10', startMin: 480, endMin: 1020, pauseAuto: true, quelle: 'stempel' }],
  optionen: { sollMin: 420, grenzeMin: 900, modus: 'gesamt', letzteSync: 1750000000000 }
});
eq(s.eintraege.length, 1, 'Eintrag uebernommen');
eq(s.eintraege[0].job, 'synera', 'alter Eintrag gehoert zu Synera');
eq(s.jobs.synera.sollMin, 420, 'alte Sollzeit uebernommen');
eq(s.jobs.synera.grenzeMin, 900, 'alte Grenze uebernommen');
eq(s.jobs.synera.modus, 'gesamt', 'alter Verguetungsmodus uebernommen');
eq(s.aktiv.synera.startMin, 500, 'laufende Schicht landet bei Synera');
eq(s.optionen.letzteSync.synera, 1750000000000, 'Sync-Zeitpunkt uebernommen');

// Fassung 2 bleibt unveraendert
s = ladeMit({
  v: 2, aktuell: 'kinelense',
  jobs: { synera: { sollMin: 480, grenzeMin: 1200, modus: 'ueberhang', feiertage: true },
          kinelense: { sollMin: 0, grenzeMin: 0, modus: 'ueberhang', feiertage: false },
          kiwerkstatt: { sollMin: 0, grenzeMin: 0, modus: 'ueberhang', feiertage: false } },
  aktiv: { kinelense: { date: '2026-09-14', startMin: 600 } },
  eintraege: [{ id: 'y', job: 'kiwerkstatt', date: '2026-09-01', startMin: 540, endMin: 720 }],
  optionen: { kontoModell: 'arbeitstage', letzteSync: { synera: 1 } }
});
eq(s.aktuell, 'kinelense', 'zuletzt gewaehlter Job bleibt');
eq(s.eintraege[0].job, 'kiwerkstatt', 'Jobzuordnung bleibt erhalten');
eq(s.optionen.kontoModell, 'arbeitstage', 'Kontomodell bleibt');
eq(s.aktiv.kinelense.startMin, 600, 'laufende Schicht bleibt beim richtigen Job');

// Kaputter Speicher darf nicht zum Absturz fuehren
const ctx2 = { window: {}, Speicher: { lies: () => '{kaputt', schreib: () => {}, dauerhaft: true }, Number, JSON, Date, Object, Array, console };
vm.createContext(ctx2); vm.runInContext(teil + '\n; var __S = laden();', ctx2);
eq(ctx2.__S.eintraege.length, 0, 'unlesbarer Speicher ergibt leeren Zustand');

// Unbekannter Job in einem Eintrag wird aufgefangen
s = ladeMit({ v: 2, jobs: {}, eintraege: [{ id: 'z', job: 'gibtsnicht', date: '2026-01-05', startMin: 480, endMin: 960 }] });
eq(s.eintraege[0].job, 'synera', 'unbekannter Job faellt auf Synera zurueck');

console.log(fails === 0 ? '\nAlle Tests bestanden.' : '\n' + fails + ' Test(s) fehlgeschlagen.');
process.exit(fails === 0 ? 0 : 1);
