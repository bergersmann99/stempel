const c = require('./core.js');
let fails = 0;
function eq(actual, expected, label) {
  const ok = actual === expected;
  if (!ok) fails++;
  console.log((ok ? 'ok  ' : 'FAIL') + '  ' + label + '  got=' + actual + ' want=' + expected);
}

// Pausenschwellen, pauschal
eq(c.autoPause(360), 0, 'genau 6:00 anwesend -> keine Pause');
eq(c.autoPause(361), 30, '6:01 anwesend -> 30 Min');
eq(c.autoPause(540), 30, 'genau 9:00 anwesend -> 30 Min');
eq(c.autoPause(541), 45, '9:01 anwesend -> 45 Min');
eq(c.autoPause(0), 0, 'null Anwesenheit -> keine Pause');

// Anwesenheit
eq(c.brutto(8 * 60 + 12, 17 * 60 + 3), 531, '08:12 bis 17:03');
eq(c.brutto(22 * 60, 6 * 60), 480, 'Nachtschicht 22:00 bis 06:00');

// Netto mit Automatik
eq(c.netto({ startMin: 480, endMin: 1020, pauseAuto: true }), 510, '08:00-17:00 -> 8:30 netto');
eq(c.netto({ startMin: 480, endMin: 850, pauseAuto: true }), 340, '08:00-14:10 -> 5:40 netto');
eq(c.netto({ startMin: 480, endMin: 840, pauseAuto: true }), 360, '08:00-14:00 -> 6:00 netto, keine Pause');

// Manuelle Pause schlaegt Automatik
eq(c.netto({ startMin: 480, endMin: 1020, pauseAuto: false, pauseMin: 60 }), 480, 'manuelle Pause 60 Min');
eq(c.netto({ startMin: 480, endMin: 1020, pauseAuto: false, pauseMin: 0 }), 540, 'manuelle Pause 0 Min');

// Hinweise
eq(c.hinweise({ date: '2026-09-14', startMin: 360, endMin: 1065, pauseAuto: true }).length, 1, '06:00-17:45 -> 10h-Hinweis');
eq(
  c.hinweise(
    { date: '2026-09-15', startMin: 360, endMin: 900, pauseAuto: true },
    { date: '2026-09-14', startMin: 480, endMin: 1320, pauseAuto: true }
  ).length,
  1,
  'Ende 22:00, Start 06:00 -> Ruhezeit-Hinweis'
);
eq(
  c.hinweise(
    { date: '2026-09-15', startMin: 480, endMin: 900, pauseAuto: true },
    { date: '2026-09-14', startMin: 480, endMin: 1020, pauseAuto: true }
  ).length,
  0,
  'Ende 17:00, Start 08:00 -> kein Hinweis'
);

// Formatierung
eq(c.hhmm(531), '08:51', 'hhmm');
eq(c.saldoText(-45), '\u221200:45', 'negativer Saldo');
eq(c.saldoText(90), '+01:30', 'positiver Saldo');


// --- Ueberstundenkonto ---
var t2 = [];
function tag(d, von, bis) { return { id: d, date: d, startMin: von, endMin: bis, pauseAuto: true }; }
// Fuenf Tage 08:00-17:00 = je 8:30 netto, Soll 8:00 -> +30 Min pro Tag
for (var i = 12; i <= 16; i++) t2.push(tag('2026-01-' + i, 480, 1020));
eq(c.kontoStand(t2, 480), 150, '5 Tage a 8:30 -> +2:30 Konto');
eq(c.verguetbar(150, 1200, 'ueberhang'), 0, 'unter der Grenze nichts verguetbar');
eq(c.verguetbar(1200, 1200, 'ueberhang'), 0, 'genau an der Grenze noch nichts');
eq(c.verguetbar(1420, 1200, 'ueberhang'), 220, 'Ueberhang: 23:40 minus 20:00 = 3:40');
eq(c.verguetbar(1420, 1200, 'gesamt'), 1420, 'Alles: gesamter Saldo zaehlt');
eq(c.verguetbar(-90, 1200, 'ueberhang'), 0, 'Minusstunden sind nicht verguetbar');

// Zwei Eintraege am selben Tag duerfen das Soll nur einmal abziehen
var t3 = [tag('2026-02-02', 480, 720), tag('2026-02-02', 780, 1020)];
eq(c.kontoStand(t3, 480), 0, 'geteilter Tag 4h + 4h -> Konto 0');

// Ein Halbtag zieht das Konto ins Minus
eq(c.kontoStand([tag('2026-02-03', 480, 720)], 480), -240, 'nur 4 Stunden -> minus 4:00');

// --- Urlaub ---
function urlaub(d) { return { id: d, date: d, art: 'urlaub' }; }
eq(c.netto(urlaub('2026-03-02')), 0, 'Urlaubstag hat 0 Minuten netto');
eq(c.kontoStand([urlaub('2026-03-02')], 480), 0, 'ein einzelner Urlaubstag bleibt neutral, kein Minus');
// Vier Arbeitstage a 8:30 plus ein Urlaubstag -> Urlaubstag zaehlt nicht mit
var t4 = [tag('2026-03-02', 480, 1020), tag('2026-03-03', 480, 1020), tag('2026-03-04', 480, 1020), tag('2026-03-05', 480, 1020), urlaub('2026-03-06')];
eq(c.kontoStand(t4, 480), 120, '4 Tage a 8:30 plus 1 Urlaubstag -> +2:00, Urlaub bleibt aussen vor');

console.log(fails === 0 ? '\nAlle Tests bestanden.' : '\n' + fails + ' Test(s) fehlgeschlagen.');
process.exit(fails === 0 ? 0 : 1);
