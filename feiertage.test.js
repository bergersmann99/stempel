const F = require('./feiertage.js');
let fails = 0;
function eq(a, e, label) { const ok = a === e; if (!ok) fails++; console.log((ok ? 'ok  ' : 'FAIL') + '  ' + label + '  got=' + a + ' want=' + e); }

// Osterdaten gegen bekannte Werte
eq(F.ostersonntag(2026), '2026-04-05', 'Ostern 2026');
eq(F.ostersonntag(2025), '2025-04-20', 'Ostern 2025');
eq(F.ostersonntag(2027), '2027-03-28', 'Ostern 2027');
eq(F.ostersonntag(2024), '2024-03-31', 'Ostern 2024');

// Bewegliche Feiertage 2026, abgeglichen mit veroeffentlichten Kalendern
eq(F.feiertagAm('2026-04-03'), 'Karfreitag', 'Karfreitag 2026 = 3. April');
eq(F.feiertagAm('2026-04-06'), 'Ostermontag', 'Ostermontag 2026 = 6. April');
eq(F.feiertagAm('2026-05-14'), 'Christi Himmelfahrt', 'Himmelfahrt 2026 = 14. Mai');
eq(F.feiertagAm('2026-05-25'), 'Pfingstmontag', 'Pfingstmontag 2026 = 25. Mai');

// Feste Termine
eq(F.feiertagAm('2026-10-03'), 'Tag der Deutschen Einheit', '3. Oktober');
eq(F.feiertagAm('2026-10-31'), 'Reformationstag', '31. Oktober ab 2018');
eq(F.feiertagAm('2017-10-31'), null, 'vor 2018 kein Reformationstag in dieser Rechnung');

// Was in Bremen NICHT gilt
eq(F.feiertagAm('2026-06-04'), null, 'Fronleichnam ist in Bremen kein Feiertag');
eq(F.feiertagAm('2026-11-01'), null, 'Allerheiligen ist in Bremen kein Feiertag');
eq(F.feiertagAm('2026-01-06'), null, 'Heilige Drei Koenige ist in Bremen kein Feiertag');
eq(F.feiertagAm('2026-04-05'), null, 'Ostersonntag zaehlt nicht als gesetzlicher Feiertag');

// Anzahl
eq(F.feiertage(2026).length, 10, 'Bremen hat 10 gesetzliche Feiertage');

// Arbeitstage
eq(F.imMonat(2026, 4).length, 2, 'April 2026 hat 2 Feiertage');
eq(F.arbeitstage(2026, 4, false), 22, 'April 2026: 22 Werktage ohne Feiertagsabzug');
eq(F.arbeitstage(2026, 4, true), 20, 'April 2026: 20 Arbeitstage mit Abzug');
eq(F.arbeitstage(2026, 10, true), 22, 'Oktober 2026: beide Feiertage fallen auf Samstag, kein Abzug');
eq(F.arbeitstage(2025, 10, true), 21, 'Oktober 2025: 23 Werktage minus zwei Feiertage an Freitagen');
eq(F.arbeitstage(2026, 9, true), 22, 'September 2026 ohne Feiertage');
eq(F.arbeitstage(2026, 9, true, 14), 10, 'September 2026 bis zum 14. sind 10 Arbeitstage');

console.log(fails === 0 ? '\nAlle Tests bestanden.' : '\n' + fails + ' Test(s) fehlgeschlagen.');
process.exit(fails === 0 ? 0 : 1);
