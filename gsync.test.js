global.window = global;
require('./feiertage.js');
require('./gsync.js');
const G = global.GSync;
let fails = 0;
function eq(a, e, l) { const ok = a === e; if (!ok) fails++; console.log((ok ? 'ok  ' : 'FAIL') + '  ' + l + '  got=' + JSON.stringify(a) + ' want=' + JSON.stringify(e)); }

function hhmm(m) { return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); }
const ctx = {
  jobKey: 'synera', jobName: 'Synera', sollMin: 480, grenzeMin: 1200, modus: 'ueberhang',
  zeitstempel: '14.09.2026, 13:00',
  eintraege: [
    { id: 'a1', date: '2026-09-14', startMin: 480, endMin: 1020, pauseAuto: true, quelle: 'stempel', notiz: '' },
    { id: 'a2', date: '2026-09-14', startMin: 1080, endMin: 1140, pauseAuto: true, quelle: 'manuell', notiz: 'Abends' },
    { id: 'a3', date: '2026-04-03', startMin: 480, endMin: 900, pauseAuto: true, quelle: 'stempel', notiz: '' }
  ],
  netto: (e) => Math.max(0, (e.endMin - e.startMin) - ((e.endMin - e.startMin) > 540 ? 45 : (e.endMin - e.startMin) > 360 ? 30 : 0)),
  effektivePause: (e) => (e.endMin - e.startMin) > 540 ? 45 : (e.endMin - e.startMin) > 360 ? 30 : 0,
  hhmm,
  wochentag: () => 'Mo',
  feiertagAm: (iso) => global.Feiertage.feiertagAm(iso),
  arbeitstage: (j, m) => global.Feiertage.arbeitstage(j, m, true)
};

const z = G._baueZeilen(ctx, '2026');
eq(z.length, 3, 'drei Zeilen fuer 2026');
eq(z[0].length, 12, 'zwoelf Spalten pro Zeile');
eq(z[0][0], '2026-04-03', 'aufsteigend sortiert, April zuerst');
eq(z[0][2], 'Karfreitag', 'Feiertagsspalte gefuellt');
eq(z[0][8], '=G2-H2', 'Saldoformel zeigt auf Arbeitszeit minus Soll');
eq(z[2][8], '=G4-H4', 'Saldoformel der dritten Zeile');
eq(z[1][7], 480 / 1440, 'erster Eintrag des Tages traegt das Soll');
eq(z[2][7], 0, 'zweiter Eintrag am selben Tag traegt kein Soll');

const u = G._baueUebersicht(ctx, ['2025', '2026']).zeilen;
eq(u[0][0], 'Ueberstundenkonto Synera'.replace('Ue', '\u00dc'), 'Titel');
eq(u[2][1], '=SUM(E10:E11)', 'Stand summiert genau die Jahreszeilen');
eq(u[8][0], 'Jahr', 'Jahreskopf steht in Zeile 9');
eq(u[9][0], '2025', 'erstes Jahr in Zeile 10');
eq(u[10][0], '2026', 'zweites Jahr in Zeile 11');
eq(u[9][4], '=C10-D10', 'Jahressaldo zeigt auf seine eigene Zeile');
eq(u[12][0], 'Monat 2026', 'Monatskopf nach einer Leerzeile');
eq(u[13][0], 'Januar', 'Januar in Zeile 14');
eq(u[13][4], '=D14-C14', 'Monatsdifferenz zeigt auf ihre eigene Zeile');
eq(u[16][1], 20, 'April 2026 hat 20 Arbeitstage');
eq(u[16][2], (20 * 480) / 1440, 'Monatssoll April = 20 Tage mal 8 Stunden');
eq(u.length, 25, 'insgesamt 25 Zeilen bei zwei Jahren');

// Job ohne Sollzeit
const ohne = Object.assign({}, ctx, { sollMin: 0, jobName: 'Kinelense' });
const u2 = G._baueUebersicht(ohne, ['2026']).zeilen;
eq(u2[0][0], 'Stunden Kinelense', 'anderer Titel ohne Sollzeit');
eq(u2[2][1], '=SUM(C10:C10)', 'summiert die Gearbeitet-Spalte');
eq(u2[12][1], '', 'keine Arbeitstage ohne Sollzeit');
eq(G._baueZeilen(ohne, '2026')[0][7], 0, 'ohne Sollzeit steht im Soll eine Null');
eq(G._baueZeilen(ohne, '2026')[0][8], '', 'ohne Sollzeit bleibt der Saldo leer');
eq(G._baueZeilen(ctx, '2026')[0][8], '=G2-H2', 'mit Sollzeit steht die Saldoformel');

console.log(fails === 0 ? '\nAlle Tests bestanden.' : '\n' + fails + ' Test(s) fehlgeschlagen.');
process.exit(fails === 0 ? 0 : 1);
