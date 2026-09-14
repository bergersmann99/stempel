/* Anbindung an Google Sheets.
   Sicherheitsgrenzen dieser Datei, kurz:
   - Angefragter Bereich ist ausschliesslich drive.file. Die App sieht nur
     Dateien, die sie selbst erzeugt hat. Bestehende Dokumente, Fotos und
     Ordner in deinem Drive bleiben fuer sie unsichtbar.
   - Das Zugriffstoken liegt nur im Arbeitsspeicher. Es wird nie in
     localStorage geschrieben und ist weg, sobald die App geschlossen wird.
   - Es gibt keinen Server dazwischen. Die Daten gehen vom iPhone direkt zu
     Google, sonst nirgendwohin.
   - Kein Client Secret. Browser-Apps brauchen keins.
*/
window.GSync = (function () {
  'use strict';

  var CFG = window.STEMPEL_CONFIG || {};
  var SCOPE = 'https://www.googleapis.com/auth/drive.file';
  var SHEET_API = 'https://sheets.googleapis.com/v4/spreadsheets';
  var ID_KEY = 'stempel.sheetId.';

  var token = null;        // nur im Arbeitsspeicher
  var tokenAblauf = 0;
  var tokenClient = null;

  var SPALTEN = ['Datum', 'Tag', 'Feiertag', 'Von', 'Bis', 'Pause (Min)', 'Arbeitszeit', 'Soll', 'Saldo', 'Quelle', 'Notiz', 'ID'];
  var BREITEN = [104, 52, 150, 66, 66, 92, 104, 88, 88, 112, 240, 150];
  var MONATE = ['Januar', 'Februar', 'M\u00e4rz', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  var TINTE = { red: 0.09, green: 0.13, blue: 0.17 };
  var WEISS = { red: 1, green: 1, blue: 1 };
  var ZART = { red: 0.957, green: 0.965, blue: 0.973 };
  var WOCHENENDE = { red: 0.925, green: 0.937, blue: 0.949 };
  var ROT = { red: 0.62, green: 0.23, blue: 0.17 };

  function konfiguriert() { return !!CFG.googleClientId; }
  function gisDa() { return !!(window.google && window.google.accounts && window.google.accounts.oauth2); }
  function verbunden() { return !!token && Date.now() < tokenAblauf; }

  // Jeder Job bekommt eine eigene Tabelle, also auch einen eigenen Schluessel.
  function tabellenId(jobKey) { try { return localStorage.getItem(ID_KEY + jobKey); } catch (e) { return null; } }
  function setzeTabellenId(jobKey, id) { try { localStorage.setItem(ID_KEY + jobKey, id); } catch (e) {} }

  function tabellenLink(jobKey) {
    var id = tabellenId(jobKey);
    return id ? 'https://docs.google.com/spreadsheets/d/' + id + '/edit' : null;
  }

  /* ---------- Anmeldung ---------- */
  function holeToken(interaktiv) {
    return new Promise(function (loesen, ablehnen) {
      if (!konfiguriert()) return ablehnen(new Error('Es ist noch keine Client-ID in config.js eingetragen.'));
      if (!gisDa()) return ablehnen(new Error('Die Google-Anmeldung konnte nicht geladen werden. Bist du online?'));
      if (verbunden()) return loesen(token);

      if (!tokenClient) {
        tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CFG.googleClientId,
          scope: SCOPE,
          callback: function () {}
        });
      }
      tokenClient.callback = function (antwort) {
        if (antwort.error) return ablehnen(new Error('Die Anmeldung wurde abgebrochen oder abgelehnt.'));
        token = antwort.access_token;
        // Google gibt typischerweise 3600 Sekunden. Eine Minute Sicherheitsabstand.
        tokenAblauf = Date.now() + (Number(antwort.expires_in || 3600) - 60) * 1000;
        loesen(token);
      };
      tokenClient.requestAccessToken({ prompt: interaktiv ? 'consent' : '' });
    });
  }

  function abmelden() {
    var t = token;
    token = null; tokenAblauf = 0;
    if (t && gisDa()) { try { google.accounts.oauth2.revoke(t, function () {}); } catch (e) {} }
  }

  /* ---------- HTTP ---------- */
  async function api(pfad, methode, koerper) {
    var antwort = await fetch(pfad, {
      method: methode || 'GET',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: koerper ? JSON.stringify(koerper) : undefined
    });
    if (antwort.status === 401) { token = null; tokenAblauf = 0; throw new Error('Die Anmeldung ist abgelaufen. Bitte noch einmal verbinden.'); }
    if (!antwort.ok) {
      var text = await antwort.text();
      throw new Error('Google hat abgelehnt (' + antwort.status + '). ' + text.slice(0, 180));
    }
    return antwort.json();
  }

  /* ---------- Tabelle anlegen oder pruefen ---------- */
  async function tabelleSichern(jobKey, jobName) {
    var id = tabellenId(jobKey);
    if (id) {
      try { await api(SHEET_API + '/' + id + '?fields=spreadsheetId'); return id; }
      catch (e) {
        // Datei geloescht oder kein Zugriff mehr. Neu anlegen.
        if (String(e.message).indexOf('404') < 0 && String(e.message).indexOf('403') < 0) throw e;
      }
    }
    var titel = (CFG.dateiName || 'Arbeitszeiten') + ' ' + jobName;
    var neu = await api(SHEET_API, 'POST', {
      properties: { title: titel, locale: 'de_DE', timeZone: zeitzone() },
      sheets: [{ properties: { title: '\u00dcbersicht', index: 0 } }]
    });
    setzeTabellenId(jobKey, neu.spreadsheetId);
    await formatiereUebersicht(neu.spreadsheetId, neu.sheets[0].properties.sheetId);
    return neu.spreadsheetId;
  }

  function zeitzone() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Berlin'; }
    catch (e) { return 'Europe/Berlin'; }
  }

  async function blaetter(id) {
    var d = await api(SHEET_API + '/' + id + '?fields=sheets.properties(sheetId,title)');
    var karte = {};
    (d.sheets || []).forEach(function (s) { karte[s.properties.title] = s.properties.sheetId; });
    return karte;
  }

  /* ---------- Jahresblatt ---------- */
  async function jahrSichern(id, jahr, vorhandene, mitSoll) {
    if (vorhandene[jahr] !== undefined) return vorhandene[jahr];
    var d = await api(SHEET_API + '/' + id + ':batchUpdate', 'POST', {
      requests: [{ addSheet: { properties: { title: jahr, gridProperties: { rowCount: 500, columnCount: 12, frozenRowCount: 1 } } } }]
    });
    var blattId = d.replies[0].addSheet.properties.sheetId;
    vorhandene[jahr] = blattId;
    await formatiereJahr(id, blattId, mitSoll);
    return blattId;
  }

  async function formatiereJahr(id, blattId, mitSoll) {
    function spanne(a, b) { return { sheetId: blattId, startColumnIndex: a, endColumnIndex: b, startRowIndex: 1 }; }
    var anfragen = [
      // Kopfzeile
      {
        repeatCell: {
          range: { sheetId: blattId, startRowIndex: 0, endRowIndex: 1 },
          cell: {
            userEnteredFormat: {
              backgroundColor: TINTE,
              textFormat: { foregroundColor: WEISS, bold: true, fontSize: 10 },
              verticalAlignment: 'MIDDLE',
              padding: { top: 6, bottom: 6, left: 8, right: 8 }
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,verticalAlignment,padding)'
        }
      },
      { updateDimensionProperties: { range: { sheetId: blattId, dimension: 'ROWS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 34 }, fields: 'pixelSize' } },
      // Zahlenformate
      { repeatCell: { range: spanne(0, 1), cell: { userEnteredFormat: { numberFormat: { type: 'DATE', pattern: 'dd.mm.yyyy' } } }, fields: 'userEnteredFormat.numberFormat' } },
      { repeatCell: { range: spanne(3, 5), cell: { userEnteredFormat: { numberFormat: { type: 'DATE_TIME', pattern: 'HH:mm' }, horizontalAlignment: 'RIGHT' } }, fields: 'userEnteredFormat(numberFormat,horizontalAlignment)' } },
      { repeatCell: { range: spanne(6, 9), cell: { userEnteredFormat: { numberFormat: { type: 'DATE_TIME', pattern: '[h]:mm' }, horizontalAlignment: 'RIGHT' } }, fields: 'userEnteredFormat(numberFormat,horizontalAlignment)' } },
      { repeatCell: { range: spanne(5, 6), cell: { userEnteredFormat: { numberFormat: { type: 'NUMBER', pattern: '0' }, horizontalAlignment: 'RIGHT' } }, fields: 'userEnteredFormat(numberFormat,horizontalAlignment)' } },
      // ID-Spalte ausblenden, sie dient nur dem Abgleich
      { updateDimensionProperties: { range: { sheetId: blattId, dimension: 'COLUMNS', startIndex: 11, endIndex: 12 }, properties: { hiddenByUser: true }, fields: 'hiddenByUser' } },
      // Wochenenden einfaerben
      {
        addConditionalFormatRule: {
          rule: {
            ranges: [{ sheetId: blattId, startRowIndex: 1, startColumnIndex: 0, endColumnIndex: 11 }],
            booleanRule: {
              condition: { type: 'CUSTOM_FORMULA', values: [{ userEnteredValue: '=WEEKDAY($A2,2)>5' }] },
              format: { backgroundColor: WOCHENENDE }
            }
          },
          index: 0
        }
      },
      // Negativer Tagessaldo rot
      {
        addConditionalFormatRule: {
          rule: {
            ranges: [{ sheetId: blattId, startRowIndex: 1, startColumnIndex: 8, endColumnIndex: 9 }],
            booleanRule: {
              condition: { type: 'NUMBER_LESS', values: [{ userEnteredValue: '0' }] },
              format: { textFormat: { foregroundColor: ROT, bold: true } }
            }
          },
          index: 0
        }
      }
    ];
    // Ohne Sollzeit sind Soll und Saldo sinnlos, die Spalten bleiben eingeklappt.
    if (!mitSoll) {
      anfragen.push({ updateDimensionProperties: { range: { sheetId: blattId, dimension: 'COLUMNS', startIndex: 7, endIndex: 9 }, properties: { hiddenByUser: true }, fields: 'hiddenByUser' } });
    }
    BREITEN.forEach(function (w, i) {
      anfragen.push({ updateDimensionProperties: { range: { sheetId: blattId, dimension: 'COLUMNS', startIndex: i, endIndex: i + 1 }, properties: { pixelSize: w }, fields: 'pixelSize' } });
    });
    await api(SHEET_API + '/' + id + ':batchUpdate', 'POST', { requests: anfragen });
  }

  /* ---------- Zeilen bauen ---------- */
  function baueZeilen(ctx, jahr) {
    var liste = ctx.eintraege
      .filter(function (e) { return e.date.indexOf(jahr) === 0; })
      .sort(function (a, b) { return a.date === b.date ? (a.startMin || 0) - (b.startMin || 0) : (a.date < b.date ? -1 : 1); });

    var sollGesetzt = {};
    return liste.map(function (e, i) {
      var zeile = i + 2; // Datenbereich beginnt in Zeile 2
      var istUrlaub = e.art === 'urlaub';
      var ersterAmTag = !sollGesetzt[e.date];
      sollGesetzt[e.date] = true;
      var n = istUrlaub ? 0 : ctx.netto(e);
      return [
        e.date,
        ctx.wochentag(e.date),
        ctx.feiertagAm(e.date) || '',
        istUrlaub ? '' : ctx.hhmm(e.startMin),
        istUrlaub ? '' : ctx.hhmm(e.endMin),
        istUrlaub ? '' : ctx.effektivePause(e),
        n / 1440,
        // Ein Urlaubstag zieht kein Soll, er bleibt neutral wie ein Tag ohne Eintrag.
        ctx.sollMin && ersterAmTag && !istUrlaub ? ctx.sollMin / 1440 : 0,
        ctx.sollMin ? '=G' + zeile + '-H' + zeile : '',
        istUrlaub ? 'Urlaub' : (e.quelle === 'stempel' ? 'Gestempelt' : 'Nachgetragen'),
        e.notiz || '',
        e.id
      ];
    });
  }

  /* ---------- Uebersichtsblatt ----------
     Feste Zeilenabstaende, damit die Formatierung immer passt:
     1 Titel, 2 leer, 3 bis 8 Kennzahlen, 9 Kopf Jahre, ab 10 die Jahre,
     danach eine Leerzeile, ein Kopf und die zwoelf Monate. */
  function baueUebersicht(ctx, jahre) {
    var n = jahre.length;
    var jahrStart = 10, jahrEnde = 9 + n;
    var mKopf = jahrEnde + 2;
    var mStart = mKopf + 1;
    var mitSoll = ctx.sollMin > 0;
    var z = [];

    z.push([(mitSoll ? '\u00dcberstundenkonto ' : 'Stunden ') + ctx.jobName, '', '', '', '']);
    z.push(['', '', '', '', '']);

    if (mitSoll) {
      z.push(['Stand', '=SUM(E' + jahrStart + ':E' + jahrEnde + ')', '', '', '']);
      z.push(['Verg\u00fctungsgrenze', ctx.grenzeMin / 1440, '', '', '']);
      z.push([
        ctx.modus === 'gesamt' ? 'Verg\u00fctungsf\u00e4hig (gesamter Saldo)' : 'Verg\u00fctungsf\u00e4hig (\u00dcberhang)',
        ctx.modus === 'gesamt' ? '=IF(B3>=B4,B3,0)' : '=MAX(0,B3-B4)', '', '', ''
      ]);
      z.push(['Noch bis zur Grenze', '=MAX(0,B4-B3)', '', '', '']);
      z.push(['Sollzeit pro Tag', ctx.sollMin / 1440, '', '', '']);
      z.push(['Zuletzt aktualisiert', ctx.zeitstempel, '', '', '']);
    } else {
      z.push(['Erfasste Stunden', '=SUM(C' + jahrStart + ':C' + jahrEnde + ')', '', '', '']);
      z.push(['Zuletzt aktualisiert', ctx.zeitstempel, '', '', '']);
      z.push(['', '', '', '', '']);
      z.push(['', '', '', '', '']);
      z.push(['', '', '', '', '']);
      z.push(['', '', '', '', '']);
    }

    z.push(['Jahr', 'Tage erfasst', 'Gearbeitet', 'Soll erfasst', 'Saldo']);
    jahre.forEach(function (j, i) {
      var r = jahrStart + i, q = "'" + j + "'!";
      z.push([
        j,
        '=IFERROR(COUNTA(UNIQUE(FILTER(' + q + 'A2:A,' + q + 'A2:A<>""))),0)',
        '=SUM(' + q + 'G2:G)',
        mitSoll ? '=SUM(' + q + 'H2:H)' : '',
        mitSoll ? '=C' + r + '-D' + r : ''
      ]);
    });

    var aktuell = jahre[jahre.length - 1];
    var q2 = "'" + aktuell + "'!";
    z.push(['', '', '', '', '']);
    z.push(['Monat ' + aktuell, 'Arbeitstage', 'Soll laut Kalender', 'Gearbeitet', 'Differenz']);
    for (var m = 1; m <= 12; m++) {
      var r2 = mStart + m - 1;
      var ab = 'DATE(' + aktuell + ',' + m + ',1)';
      var bis = 'DATE(' + aktuell + ',' + (m + 1) + ',1)';
      var at = ctx.arbeitstage(Number(aktuell), m);
      z.push([
        MONATE[m - 1],
        mitSoll ? at : '',
        mitSoll ? (at * ctx.sollMin) / 1440 : '',
        '=SUMIFS(' + q2 + 'G2:G,' + q2 + 'A2:A,">="&' + ab + ',' + q2 + 'A2:A,"<"&' + bis + ')',
        mitSoll ? '=D' + r2 + '-C' + r2 : ''
      ]);
    }
    return { zeilen: z };
  }

  async function formatiereUebersicht(id, blattId) {
    var anfragen = [
      { updateSheetProperties: { properties: { sheetId: blattId, gridProperties: { frozenRowCount: 0, columnCount: 5, rowCount: 60 } }, fields: 'gridProperties(frozenRowCount,columnCount,rowCount)' } },
      { repeatCell: { range: { sheetId: blattId, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 15 } } }, fields: 'userEnteredFormat.textFormat' } },
      { repeatCell: { range: { sheetId: blattId, startRowIndex: 2, endRowIndex: 7, startColumnIndex: 0, endColumnIndex: 1 }, cell: { userEnteredFormat: { textFormat: { bold: true } } }, fields: 'userEnteredFormat.textFormat' } },
      { repeatCell: { range: { sheetId: blattId, startRowIndex: 2, endRowIndex: 7, startColumnIndex: 1, endColumnIndex: 2 }, cell: { userEnteredFormat: { numberFormat: { type: 'DATE_TIME', pattern: '[h]:mm' }, horizontalAlignment: 'RIGHT', textFormat: { fontSize: 12 } } }, fields: 'userEnteredFormat(numberFormat,horizontalAlignment,textFormat)' } },
      { repeatCell: { range: { sheetId: blattId, startRowIndex: 8, endRowIndex: 60, startColumnIndex: 2, endColumnIndex: 5 }, cell: { userEnteredFormat: { numberFormat: { type: 'DATE_TIME', pattern: '[h]:mm' }, horizontalAlignment: 'RIGHT' } }, fields: 'userEnteredFormat(numberFormat,horizontalAlignment)' } },
      { repeatCell: { range: { sheetId: blattId, startRowIndex: 8, endRowIndex: 60, startColumnIndex: 1, endColumnIndex: 2 }, cell: { userEnteredFormat: { numberFormat: { type: 'NUMBER', pattern: '0' }, horizontalAlignment: 'RIGHT' } }, fields: 'userEnteredFormat(numberFormat,horizontalAlignment)' } },
      {
        addConditionalFormatRule: {
          rule: {
            ranges: [{ sheetId: blattId, startRowIndex: 2, startColumnIndex: 1, endColumnIndex: 5 }],
            booleanRule: { condition: { type: 'NUMBER_LESS', values: [{ userEnteredValue: '0' }] }, format: { textFormat: { foregroundColor: ROT, bold: true } } }
          }, index: 0
        }
      }
    ];
    [190, 110, 120, 120, 120].forEach(function (w, i) {
      anfragen.push({ updateDimensionProperties: { range: { sheetId: blattId, dimension: 'COLUMNS', startIndex: i, endIndex: i + 1 }, properties: { pixelSize: w }, fields: 'pixelSize' } });
    });
    await api(SHEET_API + '/' + id + ':batchUpdate', 'POST', { requests: anfragen });
  }

  async function kopfzeileSetzen(id, jahr) {
    await api(SHEET_API + '/' + id + '/values/' + encodeURIComponent("'" + jahr + "'!A1:L1") + '?valueInputOption=RAW', 'PUT', { values: [SPALTEN] });
  }

  /* ---------- Synchronisieren ---------- */
  async function sync(ctx, interaktiv, jobKey) {
    jobKey = jobKey || ctx.jobKey;
    await holeToken(!!interaktiv);
    var id = await tabelleSichern(jobKey, ctx.jobName);
    var vorhanden = await blaetter(id);

    var jahre = {};
    ctx.eintraege.forEach(function (e) { jahre[e.date.slice(0, 4)] = 1; });
    var jahrListe = Object.keys(jahre).sort();
    if (!jahrListe.length) jahrListe = [String(new Date().getFullYear())];

    for (var i = 0; i < jahrListe.length; i++) {
      var jahr = jahrListe[i];
      var neu = vorhanden[jahr] === undefined;
      await jahrSichern(id, jahr, vorhanden, ctx.sollMin > 0);
      if (neu) await kopfzeileSetzen(id, jahr);

      var zeilen = baueZeilen(ctx, jahr);
      var letzte = zeilen.length + 1;
      if (zeilen.length) {
        await api(SHEET_API + '/' + id + '/values/' + encodeURIComponent("'" + jahr + "'!A2:L" + letzte) + '?valueInputOption=USER_ENTERED', 'PUT', { values: zeilen });
      }
      // Alles darunter leeren, damit geloeschte Eintraege auch dort verschwinden.
      await api(SHEET_API + '/' + id + '/values/' + encodeURIComponent("'" + jahr + "'!A" + (letzte + 1) + ':L500') + ':clear', 'POST', {});
    }

    var u = baueUebersicht(ctx, jahrListe);
    await api(SHEET_API + '/' + id + '/values/' + encodeURIComponent("'\u00dcbersicht'!A1:E60") + ':clear', 'POST', {});
    await api(SHEET_API + '/' + id + '/values/' + encodeURIComponent("'\u00dcbersicht'!A1") + '?valueInputOption=USER_ENTERED', 'PUT', { values: u.zeilen, majorDimension: 'ROWS' });

    return { id: id, jahre: jahrListe, zeilen: ctx.eintraege.length };
  }

  return {
    konfiguriert: konfiguriert,
    verbunden: verbunden,
    sync: sync,
    abmelden: abmelden,
    tabellenLink: tabellenLink,
    zeitzone: zeitzone,
    // nur fuer die Tests, damit die Zeilen- und Spaltenarithmetik pruefbar bleibt
    _baueZeilen: baueZeilen,
    _baueUebersicht: baueUebersicht
  };
})();
