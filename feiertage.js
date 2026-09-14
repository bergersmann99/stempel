/* Gesetzliche Feiertage im Land Bremen, berechnet statt gepflegt.
   Bremen hat zehn: Neujahr, Karfreitag, Ostermontag, Tag der Arbeit,
   Christi Himmelfahrt, Pfingstmontag, Tag der Deutschen Einheit,
   Reformationstag sowie beide Weihnachtstage.
   Nicht dabei sind Fronleichnam, Allerheiligen und Buss- und Bettag.
   Der Reformationstag gilt in Bremen seit 2018. */
(function (global) {
  'use strict';

  function iso(d) {
    return d.getUTCFullYear() + '-' +
      String(d.getUTCMonth() + 1).padStart(2, '0') + '-' +
      String(d.getUTCDate()).padStart(2, '0');
  }
  function plus(d, tage) {
    return new Date(d.getTime() + tage * 86400000);
  }

  // Gaussche Osterformel in der gregorianischen Fassung.
  function ostersonntag(jahr) {
    var a = jahr % 19, b = Math.floor(jahr / 100), c = jahr % 100;
    var d = Math.floor(b / 4), e = b % 4;
    var f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4), k = c % 4;
    var l = (32 + 2 * e + 2 * i - h - k) % 7;
    var m = Math.floor((a + 11 * h + 22 * l) / 451);
    var monat = Math.floor((h + l - 7 * m + 114) / 31);
    var tag = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(jahr, monat - 1, tag));
  }

  var zwischenspeicher = {};

  function feiertage(jahr) {
    if (zwischenspeicher[jahr]) return zwischenspeicher[jahr];
    var o = ostersonntag(jahr);
    var liste = [
      { datum: jahr + '-01-01', name: 'Neujahr' },
      { datum: iso(plus(o, -2)), name: 'Karfreitag' },
      { datum: iso(plus(o, 1)), name: 'Ostermontag' },
      { datum: jahr + '-05-01', name: 'Tag der Arbeit' },
      { datum: iso(plus(o, 39)), name: 'Christi Himmelfahrt' },
      { datum: iso(plus(o, 50)), name: 'Pfingstmontag' },
      { datum: jahr + '-10-03', name: 'Tag der Deutschen Einheit' },
      { datum: jahr + '-12-25', name: '1. Weihnachtstag' },
      { datum: jahr + '-12-26', name: '2. Weihnachtstag' }
    ];
    if (jahr >= 2018) liste.push({ datum: jahr + '-10-31', name: 'Reformationstag' });
    liste.sort(function (a, b) { return a.datum < b.datum ? -1 : 1; });
    zwischenspeicher[jahr] = liste;
    return liste;
  }

  // Name des Feiertags oder null.
  function feiertagAm(isoDatum) {
    var jahr = parseInt(isoDatum.slice(0, 4), 10);
    var treffer = feiertage(jahr).filter(function (f) { return f.datum === isoDatum; });
    return treffer.length ? treffer[0].name : null;
  }

  // Feiertage eines Monats. monat ist 1 bis 12.
  function imMonat(jahr, monat) {
    var pre = jahr + '-' + String(monat).padStart(2, '0');
    return feiertage(jahr).filter(function (f) { return f.datum.indexOf(pre) === 0; });
  }

  // Arbeitstage: Montag bis Freitag ohne Feiertage.
  // bisTag begrenzt optional auf einen Tag im Monat, fuer den laufenden Monat.
  function arbeitstage(jahr, monat, mitFeiertagen, bisTag) {
    var letzter = new Date(Date.UTC(jahr, monat, 0)).getUTCDate();
    var ende = bisTag ? Math.min(bisTag, letzter) : letzter;
    var frei = {};
    if (mitFeiertagen !== false) {
      imMonat(jahr, monat).forEach(function (f) { frei[f.datum] = 1; });
    }
    var n = 0;
    for (var t = 1; t <= ende; t++) {
      var d = new Date(Date.UTC(jahr, monat - 1, t));
      var wt = d.getUTCDay();
      if (wt === 0 || wt === 6) continue;
      if (frei[iso(d)]) continue;
      n++;
    }
    return n;
  }

  var api = {
    ostersonntag: function (j) { return iso(ostersonntag(j)); },
    feiertage: feiertage,
    feiertagAm: feiertagAm,
    imMonat: imMonat,
    arbeitstage: arbeitstage
  };

  global.Feiertage = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
