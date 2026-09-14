// Kernlogik der Zeiterfassung. Reine Funktionen, damit sie testbar bleiben.

const MIN_TAG = 1440;

// Pauschale Pausenregel nach ArbZG §4, angewandt auf die Anwesenheit.
// Mehr als 6 Stunden anwesend -> 30 Minuten, mehr als 9 Stunden -> 45 Minuten.
function autoPause(bruttoMin) {
  if (bruttoMin > 540) return 45;
  if (bruttoMin > 360) return 30;
  return 0;
}

// Anwesenheit in Minuten, inklusive Schichten ueber Mitternacht.
function brutto(startMin, endMin) {
  let d = endMin - startMin;
  if (d < 0) d += MIN_TAG;
  return d;
}

function netto(entry) {
  if (entry.art === 'urlaub') return 0;
  const b = brutto(entry.startMin, entry.endMin);
  return Math.max(0, b - effektivePause(entry));
}

function effektivePause(entry) {
  if (entry.pauseAuto === false && Number.isFinite(entry.pauseMin)) return entry.pauseMin;
  return autoPause(brutto(entry.startMin, entry.endMin));
}

// Hinweise nach ArbZG. Gibt eine Liste von Kurztexten zurueck.
function hinweise(entry, vorherigerEintrag) {
  const out = [];
  const n = netto(entry);
  if (n > 600) out.push('Ueber 10 Stunden');
  if (vorherigerEintrag) {
    // Ende des Vortags auf die Zeitachse des aktuellen Tages umrechnen.
    // Ein Eintrag, der ueber Mitternacht laeuft, endet einen Tag spaeter als sein Datum.
    const ueberMitternacht = vorherigerEintrag.endMin < vorherigerEintrag.startMin ? MIN_TAG : 0;
    const versatz = tageDiff(vorherigerEintrag.date, entry.date) * MIN_TAG;
    const endeVorher = vorherigerEintrag.endMin + ueberMitternacht - versatz;
    const ruhe = entry.startMin - endeVorher;
    if (ruhe >= 0 && ruhe < 660) out.push('Ruhezeit unter 11 Stunden');
  }
  return out;
}

function tageDiff(a, b) {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
}

function hhmm(min) {
  const v = Math.max(0, Math.round(min));
  return String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0');
}

function saldoText(min) {
  const s = min < 0 ? '\u2212' : '+';
  return s + hhmm(Math.abs(min));
}

if (typeof module !== 'undefined') {
  module.exports = { autoPause, brutto, netto, effektivePause, hinweise, hhmm, saldoText, tageDiff };
}

// Ueberstundenkonto ueber alle erfassten Tage.
// Urlaubstage zaehlen nicht als Tag mit Soll, sie bleiben neutral.
function kontoStand(eintraege, sollMin) {
  var summe = 0, tage = {};
  eintraege.forEach(function (e) {
    summe += netto(e);
    if (e.art !== 'urlaub') tage[e.date] = 1;
  });
  return summe - Object.keys(tage).length * sollMin;
}

// Was davon ist verguetungsfaehig?
function verguetbar(konto, grenzeMin, modus) {
  if (konto < grenzeMin) return 0;
  return modus === 'gesamt' ? konto : konto - grenzeMin;
}

if (typeof module !== 'undefined') {
  module.exports.kontoStand = kontoStand;
  module.exports.verguetbar = verguetbar;
}
