# Stempel

Arbeitszeiterfassung als PWA fuer das iPhone. Laeuft offline, speichert lokal
und synchronisiert in eine Google-Tabelle in deinem Drive.

## Was drin ist

- Ein Knopf, der zwischen **Kommen** und **Gehen** wechselt
- Pausenabzug pauschal nach ArbZG §4: mehr als 6 Stunden Anwesenheit ziehen
  30 Minuten ab, mehr als 9 Stunden ziehen 45 Minuten ab
- Pause pro Tag auch von Hand setzbar
- Zeiten nachtragen, korrigieren, loeschen
- **Urlaub eintragen**, auch fuer mehrere Tage am Stueck, ohne dafuer zu stempeln
- **Vertragsbeginn** je Job, falls er mitten in einem Monat liegt
- **Ueberstundenkonto** mit der Vertragsgrenze von 20 Stunden
- **Drei Jobs** mit getrennten Zeiten, Einstellungen und Tabellen
- **Feiertage des Landes Bremen**, inklusive Monatssoll aus den Arbeitstagen
- Monatsansicht mit Summe, Saldo und Anzahl der Tage
- Hinweis bei mehr als 10 Stunden Arbeitszeit (§3) und unter 11 Stunden Ruhezeit (§5)
- Synchronisierung nach Google Sheets, ein Blatt pro Jahr
- Export als CSV ueber das iOS-Teilen-Menue

## Das Ueberstundenkonto

Das Konto laeuft ueber **alle** erfassten Tage, nicht nur den Sichtmonat.

    Konto = Summe aller Arbeitszeiten − (Anzahl Tage mit Eintrag × Sollzeit)

Bei 8:00 Sollzeit entspricht das der 40-Stunden-Woche. Tage ohne Eintrag zaehlen
nicht mit, Urlaub und Krankheit ziehen den Saldo also nicht ins Minus. Hat ein Tag
zwei Eintraege, etwa weil du mittags ausgestempelt hast, wird die Sollzeit fuer
diesen Tag trotzdem nur einmal abgezogen.

Die Anzeige kennt drei Zustaende:

| Konto | Anzeige |
|---|---|
| negativ | Minusstunden, und wie weit es bis zur Grenze ist |
| unter 20:00 | wie viel noch bis zur Verguetungsgrenze fehlt |
| ab 20:00 | wie viel verguetungsfaehig ist |

**Welches Soll das Konto abzieht,** kannst du in den Einstellungen umschalten:

- **Erfasste Tage** (voreingestellt) zieht die Sollzeit nur fuer Tage ab, an denen
  ein Eintrag steht. Urlaub und Krankheit bleiben damit neutral.
- **Arbeitstage** zieht die Sollzeit fuer jeden Werktag ohne Feiertag ab, vom ersten
  Eintrag bis heute. Das entspricht der Sicht der Lohnabrechnung, erzeugt aber
  Minusstunden fuer jeden Arbeitstag, den du nicht erfasst, auch fuer Urlaub.

Das Monatssoll in der Kachel oben wird immer nach Arbeitstagen gerechnet, unabhaengig
von dieser Einstellung. Es ist eine reine Information, keine Grundlage des Kontos.

**Eine Frage, die du in deinem Vertrag nachlesen solltest:** Wenn die Grenze
ueberschritten ist, wird dann nur der Teil oberhalb von 20 Stunden verguetet, oder
der gesamte Saldo? Beide Formulierungen kommen in Vertraegen vor. In den
Einstellungen kannst du zwischen **Ueberhang** und **Alles** umschalten.
Voreingestellt ist Ueberhang, weil deine Formulierung "erst ab ueber 20
Ueberstunden" am ehesten darauf hindeutet. Die Grenze selbst ist ebenfalls
einstellbar.

## Urlaub

Beim Nachtragen laesst sich die Art auf **Urlaub** umschalten. Statt Von und Bis
gibst du dann nur ein Datum an, optional mit einem zweiten Datum als Ende eines
Zeitraums. Wochenenden und, sofern fuer den Job aktiv, Feiertage zaehlen dabei
nicht mit, dort musst du also nichts eintragen.

Ein Urlaubstag bleibt fuer das Ueberstundenkonto neutral, egal welches der beiden
Modelle unter **Soll rechnet nach** eingestellt ist: Er zieht kein Soll ab, traegt
aber auch keine Arbeitszeit bei. Das gilt genauso fuer die Google-Tabelle.

## Vertragsbeginn

In den Einstellungen laesst sich pro Job ein **Vertragsbeginn** hinterlegen. Das
ist nur noetig, wenn der Job mitten in einem Monat angefangen hat oder anfaengt.
Ist ein Datum gesetzt, zaehlt das Monatssoll fuer diesen einen Monat erst ab
diesem Tag, alle folgenden Monate sind davon unberuehrt. Ohne gesetztes Datum
aendert sich nichts an der bisherigen Rechnung.

## Jobs

Voreingestellt ist immer **Synera**. Daneben gibt es **Kinelense** und
**KI-Werkstatt**. Die Leiste unter dem Monatstitel schaltet um, ein gruener Punkt
auf einem Job heisst, dass dort gerade eine Schicht laeuft. Du kannst in zwei Jobs
gleichzeitig eingestempelt sein, das behindert sich nicht.

Jeder Job hat eigene Einstellungen und eine eigene Google-Tabelle:

| Job | Sollzeit | Konto | Feiertage |
|---|---|---|---|
| Synera | 8:00 | Grenze 20:00 | Bremen |
| Kinelense | keine | keins | aus |
| KI-Werkstatt | keine | keins | aus |

Sollzeit `00:00` heisst: kein Soll, kein Monatssoll, kein Ueberstundenkonto. Genau
das ist bei Kinelense und der KI-Werkstatt gewollt, weil dort auftragsbasiert
gearbeitet und nach geleisteten Stunden abgerechnet wird. Die Karte oben zeigt
deshalb die erfassten Stunden, die Monatskachel die Stunden des Monats.

Auch in der Tabelle verschwindet alles Soll-bezogene: die Spalten `Soll` und `Saldo`
bleiben eingeklappt, und die Uebersicht zeigt statt des Kontos die erfassten Stunden
je Jahr und Monat. Was du fuer eine Rechnung brauchst, steht damit direkt da.

Soll fuer einen dieser Jobs doch eine Wochenarbeitszeit gelten, traegst du einfach
eine Sollzeit ein, dann erscheinen Grenze, Konto und Monatssoll von selbst.

Alles ist pro Job getrennt: Zeiten, Konto, Monatssoll, Feiertagslogik und die
Tabelle in Drive. Der CSV-Export enthaelt dagegen alle Jobs mit einer Job-Spalte.

## Feiertage und Monatssoll

Die App rechnet die zehn gesetzlichen Feiertage des Landes Bremen selbst aus, statt
sie als Liste zu pflegen. Damit stimmt sie auch in kommenden Jahren:

Neujahr, Karfreitag, Ostermontag, Tag der Arbeit, Christi Himmelfahrt,
Pfingstmontag, Tag der Deutschen Einheit, Reformationstag, 1. und 2. Weihnachtstag.

Die beweglichen Termine folgen aus der Gaussschen Osterformel. Fronleichnam,
Allerheiligen und Buss- und Bettag sind in Bremen keine gesetzlichen Feiertage und
werden deshalb nicht abgezogen. Der Reformationstag gilt in Bremen seit 2018, das
Feiertagsgesetz deckt Bremen und Bremerhaven gleichermassen ab.

**Beim Stempeln** erscheint an einem Feiertag ein Band direkt ueber dem Knopf, und
beim Einstempeln zusaetzlich ein kurzer Hinweis. Die Zeit wird trotzdem ganz normal
erfasst, ob sie als Mehrarbeit gilt, regelt dein Vertrag.

**Im Monat** siehst du ausserdem Feiertage, an denen du nichts erfasst hast, als
graue Zeile in der Stempelkarte. Die Kachel oben zeigt:

    Monatssoll = (Werktage Mo bis Fr − Feiertage an Werktagen) × Sollzeit

Beispiel April 2026: 22 Werktage, davon Karfreitag am 3. und Ostermontag am 6.,
macht 20 Arbeitstage und damit 160 Stunden Soll. Im Oktober 2026 faellt sowohl der
3. als auch der 31. auf einen Samstag, dort bleiben alle 22 Arbeitstage bestehen.

## Datum und Zeitzone

Die App nimmt Datum und Uhrzeit vom Geraet. Das iPhone stellt seine Zeitzone
automatisch nach deinem Standort, wenn in den iOS-Einstellungen unter
`Datenschutz & Sicherheit`, `Ortungsdienste`, `Systemdienste` die Option
`Zeitzone einstellen` aktiv ist. Damit stimmt das Datum auch, wenn du
verreist bist.

Die App fragt bewusst **keine** Ortungsberechtigung an. GPS liefert Koordinaten,
kein Kalenderdatum. Das Datum ergibt sich aus Uhr und Zeitzone, und die kennt das
Betriebssystem bereits. Eine zusaetzliche Standortfreigabe wuerde das Ergebnis
nicht verbessern, sondern nur eine Berechtigung mehr kosten.

Welche Zeitzone gerade gilt, siehst du in den Einstellungen. Die Google-Tabelle
wird beim Anlegen auf dieselbe Zeitzone gesetzt.

## Aufbau der Google-Tabelle

**Jeder Job bekommt eine eigene Datei**, benannt nach dem Muster
`Arbeitszeiten Synera`, `Arbeitszeiten Kinelense`, `Arbeitszeiten KI-Werkstatt`.
Die App legt sie beim ersten Synchronisieren selbst an. Du musst nichts
vorbereiten. Danach kannst du sie in Drive in einen beliebigen Ordner
verschieben, die App findet sie ueber ihre ID weiter.

**Blatt `Uebersicht`**

Oben das Ueberstundenkonto mit Stand, Grenze, verguetungsfaehigem Anteil und
Restweg bis zur Grenze. Darunter eine Zeile pro Jahr. Darunter die zwoelf Monate des
aktuellen Jahres mit Arbeitstagen, Monatssoll, tatsaechlich Gearbeitetem und der
Differenz.

Die Summen sind Formeln, keine eingefrorenen Zahlen. Wenn du in einem Jahresblatt
von Hand etwas korrigierst, rechnet die Uebersicht mit. Arbeitstage und Monatssoll
schreibt die App als feste Werte, weil Sheets die deutschen Feiertage nicht kennt.

**Ein Blatt pro Jahr, benannt nach der Jahreszahl**

| Spalte | Inhalt |
|---|---|
| Datum | echtes Datum, Format TT.MM.JJJJ |
| Tag | Wochentag |
| Feiertag | Name des Feiertags, sonst leer |
| Von / Bis | Uhrzeiten |
| Pause (Min) | tatsaechlich abgezogene Minuten |
| Arbeitszeit | Dauer im Format `[h]:mm`, summierbar |
| Soll | Sollzeit, nur in der ersten Zeile eines Tages |
| Saldo | Formel `Arbeitszeit − Soll` |
| Quelle | Gestempelt oder Nachgetragen |
| Notiz | freier Text |
| ID | ausgeblendet, dient nur dem Abgleich |

Kopfzeile fixiert und dunkel hinterlegt, Wochenenden grau eingefaerbt, negative
Salden rot. Dauern liegen als echte Zeitwerte vor, nicht als Text, du kannst also
ohne Umwege daneben weiterrechnen.

Die App schreibt bei jeder Synchronisierung den kompletten Datenbereich ab Zeile 2
neu. Geloeschte Eintraege verschwinden dadurch auch in der Tabelle. Eigene Spalten
ab Spalte L bleiben unangetastet, eigene Eintraege innerhalb von A bis K werden
ueberschrieben.

---

# Sicherheit

Das war deine Bedingung, deshalb hier ausfuehrlich, was die App tut und was nicht.

## Die App kann nur ihre eigene Datei sehen

Sie fragt ausschliesslich den Bereich **`drive.file`** an. Dieser Bereich gibt
Zugriff auf genau die Dateien, die die App selbst erzeugt hat. Deine uebrigen
Dokumente, Fotos und Ordner existieren fuer sie nicht, auch nicht lesend. Selbst
wenn der Code kompromittiert waere, koennte er nichts anderes anfassen, weil die
Grenze bei Google gezogen wird und nicht im Code.

Die naheliegende Alternative `drive` waere ein Vollzugriff auf dein gesamtes
Laufwerk. Die nutzt diese App nicht, und sie braucht sie auch nicht.

Nebeneffekt: `drive.file` gilt bei Google als nicht sensibel. Deine App muss
deshalb kein Verifizierungsverfahren durchlaufen.

## Die Client-ID ist kein Geheimnis

Sie steht im Quelltext, wie bei jeder Browser-App. Der Schutz liegt woanders:
In der Cloud Console traegst du deine Pages-Adresse als einzigen erlaubten
JavaScript-Ursprung ein. Ruft jemand deine Client-ID von einer anderen Domain aus
auf, verweigert Google die Ausgabe eines Tokens.

Ein **Client Secret gehoert nicht in diese App**. Browser-Apps brauchen keins.
Wenn die Console dir eines anbietet, ignoriere es und lege es nirgends ab. Dein
GitHub-Repository darf oeffentlich sein.

## Das Token lebt nur im Arbeitsspeicher

Das Zugriffstoken wird nie in localStorage geschrieben. Es liegt in einer Variablen,
ist rund eine Stunde gueltig und verschwindet, sobald du die App schliesst. Wer dein
entsperrtes Telefon in die Hand bekommt, findet also kein dauerhaft gespeichertes
Zugangsgeheimnis vor.

## Es gibt keinen Server dazwischen

Die Daten gehen vom iPhone direkt zu Google. Kein eigener Backend-Dienst, kein
Apps-Script-Endpunkt, kein Dritter. Das ist auch der Grund, warum ich dir die
Apps-Script-Variante nicht empfohlen habe: Sie braucht einen oeffentlich
erreichbaren Endpunkt plus ein gemeinsames Geheimnis im Quelltext, und dieses
Geheimnis waere dann tatsaechlich eins, das nicht oeffentlich stehen duerfte.

## Zugriff widerrufen

Jederzeit unter <https://myaccount.google.com/permissions>. Danach kann die App
nichts mehr schreiben, deine bereits synchronisierte Tabelle bleibt dir erhalten.

---

# Einrichtung

## 1. Google Cloud vorbereiten

Das geht mit einem ganz normalen privaten Google-Konto, eine Organisation ist
nicht noetig.

1. <https://console.cloud.google.com> oeffnen, oben ein neues Projekt `Stempel` anlegen
2. `APIs & Dienste`, dann `Bibliothek`: **Google Sheets API** und **Google Drive API**
   jeweils aktivieren
3. `APIs & Dienste`, dann `OAuth-Zustimmungsbildschirm`:
   - Nutzertyp **Extern**
   - App-Name `Stempel`, deine Mailadresse als Support- und Entwicklerkontakt
   - Bei den Bereichen `https://www.googleapis.com/auth/drive.file` hinzufuegen
   - Anschliessend den Status auf **In Produktion** setzen. Da nur ein nicht
     sensibler Bereich verwendet wird, ist dafuer keine Pruefung durch Google
     noetig. Bleibst du im Testmodus, siehst du bei jeder Anmeldung eine Warnung
     und musst dich regelmaessig neu verbinden.
4. `Anmeldedaten`, dann `Anmeldedaten erstellen`, dann `OAuth-Client-ID`:
   - Anwendungstyp **Webanwendung**
   - Unter *Autorisierte JavaScript-Quellen* deine Pages-Adresse eintragen,
     und zwar **nur Schema und Host, ohne Pfad**:
     `https://<dein-name>.github.io`
   - Weiterleitungs-URIs brauchst du nicht
5. Die Client-ID kopieren, sie endet auf `.apps.googleusercontent.com`

## 2. Client-ID eintragen

In `config.js`:

```js
window.STEMPEL_CONFIG = {
  googleClientId: '1234567890-abcdef.apps.googleusercontent.com',
  dateiName: 'Arbeitszeiten'
};
```

## 3. Veroeffentlichen auf GitHub Pages

1. Neues Repository anlegen, zum Beispiel `stempel`
2. Alle Dateien flach ins Wurzelverzeichnis legen
3. `Settings`, dann `Pages`, Source auf `Deploy from a branch`, Branch `main`,
   Ordner `/ (root)`
4. Nach ein bis zwei Minuten liegt die App unter
   `https://<dein-name>.github.io/stempel/`

HTTPS ist Pflicht, sonst startet der Service Worker nicht. GitHub Pages liefert das mit.

## 4. Auf dem iPhone installieren

1. Die Adresse in **Safari** oeffnen, nicht in Chrome. Nur Safari darf auf iOS
   auf den Home-Bildschirm legen.
2. Teilen-Symbol, dann `Zum Home-Bildschirm`
3. App vom Home-Bildschirm starten, dann in den Einstellungen auf
   `Diesen Job synchronisieren`. Beim ersten Mal fuer jeden Job einmal, oder
   einmal auf `Alle Jobs synchronisieren`.

Die installierte App hat einen eigenen Speicher. Zeiten, die du vorher im
Safari-Tab erfasst hast, tauchen dort nicht auf. Also erst installieren, dann erfassen.

## Nach jeder Aenderung am Code

Der Service Worker liefert aus dem Cache. Wenn du `index.html`, `config.js` oder
`gsync.js` oder `feiertage.js` aenderst, in `sw.js` die Zeile
`const CACHE = 'stempel-v4'` hochzaehlen.

---

# Dateien

| Datei | Zweck |
|---|---|
| `index.html` | Oberflaeche und Zeitlogik, in sich geschlossen |
| `config.js` | deine Client-ID, die einzige Datei, die du anfassen musst |
| `gsync.js` | Anmeldung bei Google und Schreiben in die Tabelle |
| `feiertage.js` | Feiertage Bremen und Arbeitstage, ohne Abhaengigkeiten |
| `sw.js` | Offline-Betrieb |
| `manifest.webmanifest` | Name, Icons, Startverhalten |
| `icon-180/192/512.png` | App-Icons |
| `core.js` | Zeitlogik einzeln, unabhaengig vom UI |
| `*.test.js` | Tests. Alle auf einmal mit `node alle.test.js` |

# Was du im Betrieb merken wirst

Google gibt Browser-Apps Zugriffstoken mit etwa einer Stunde Laufzeit und kein
dauerhaftes Erneuerungstoken. Solange deine Google-Sitzung im Hintergrund gueltig
ist, holt die App sich still ein neues Token. Ist sie es nicht, tippst du einmal
auf den Sync-Knopf und bist wieder verbunden.

Das Stempeln haengt nicht daran. Die App schreibt immer zuerst lokal und schiebt
die Daten nach Google, sobald eine gueltige Anmeldung da ist. Ein abgelaufenes
Token kostet dich keine erfasste Minute, nur die Synchronisierung verzoegert sich.
