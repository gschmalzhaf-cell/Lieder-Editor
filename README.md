# Lieder-Editor

Ein Editor für Lieder im SongBeamer-Format (`.sng`). Du brauchst keine Technikkenntnisse:
Du arbeitest mit **Strophe, Refrain, Bridge und Co.** – den Rest (das Dateiformat) macht das
Programm automatisch im Hintergrund.

Alles läuft **direkt in deinem Browser** (am Laptop oder am Tablet). Es gibt keinen Server, kein
Konto und keine Datenbank. Nichts wird ins Internet hochgeladen.

---

## So benutzt du den Editor

### Schritt 1: Startseite

![Startseite mit den zwei großen Knöpfen](docs/schritt-1-start.svg)

- **„Neues Lied“** – du fängst mit einem leeren Lied an.
- **„Datei öffnen“** – du lädst eine vorhandene `.sng`-Datei (auch durch Draufziehen auf die
  Seite). Die Datei wird automatisch gelesen: Titel, Autor und alle Liedteile erscheinen als
  Karten.

### Schritt 2: Kopfdaten ausfüllen

![Kopfdaten: Titel und freiwillige Felder](docs/schritt-2-kopfdaten.svg)

Oben steht der **Titel** – das ist das einzige Pflichtfeld. Darunter kannst du freiwillig
Autor, Melodie, Liednummer, Copyright und Notizen eintragen. Leer lassen ist erlaubt.

### Schritt 3: Liedteile anlegen und bearbeiten

![Karten mit Strophe und Refrain](docs/schritt-3-teile.svg)

Jeder Liedteil ist eine **Karte** mit Sinnbild, Farbe und Namen. Darüber liegen drei große
Knöpfe:

- **„Strophe hinzufügen“** – wird automatisch nummeriert (Vers 1, Vers 2, …)
- **„Refrain hinzufügen“** – (Refrain, Refrain 2, …)
- **„Weiteres Teil“** – öffnet ein Menü mit Bridge, Intro, Schluss, Zwischenspiel,
  gesprochenem Text, Antwort, Solo und weiteren seltenen Teilen

In jede Karte schreibst du den Text direkt hinein. **Mehrere Zeilen** sind möglich; eine
**leere Zeile** macht später Abstand auf der Folie.

An jeder Karte kannst du:

- **umbenennen** (auf den Namen klicken),
- **verschieben** – am Laptop mit der Maus am Griff-Symbol (⠿) ziehen, am Tablet **lange auf das
  Griff-Symbol drücken** und dann ziehen; alternativ die Knöpfe „Nach oben“ / „Nach unten“,
- **wiederholen** („Teil wiederholen“ legt eine zweite, unabhängige Karte mit demselben Namen
  an – beim Speichern wird sie als eigener Abschnitt ausgeschrieben),
- **löschen** – erst ein Klick, dann erscheint „Wirklich löschen?“ zum zweiten Klick,
- **Text übernehmen** – kopiert den Text der Karte in die Zwischenablage.

### Schritt 4: Vorschau

![Vorschau der Folie neben den Karten](docs/schritt-4-vorschau.svg)

Rechts (auf dem Tablet darunter) siehst du die **Folie im Hochformat**, so wie die Gemeinde sie
später sieht: große Schrift, alles mittig. Wenn du durch die Karten klickst oder die
„Zurück“/„Weiter“-Knöpfe benutzt, wandert die Vorschau mit.

### Schritt 5: Speichern

![Prüfung und Speichern](docs/schritt-5-speichern.svg)

Der Knopf **„Als Datei speichern“** prüft das Lied zuerst und meldet in schlichter Sprache, was
noch fehlt, zum Beispiel:

- „Bitte gib dem Lied noch einen Titel.“
- „Die Strophe 2 ist noch leer. Fülle sie oder lösch sie.“
- „Im Refrain stehen nur leere Zeilen.“
- „Das Lied hat noch keine Teile. Füge eine Strophe hinzu.“

Ist alles gut, lädt der Browser die fertige `.sng`-Datei herunter. Der Dateiname entsteht aus
dem Titel, zum Beispiel `Näher_mein_Gott_zu_Dir.sng`.

**Nebenbei:** Das Programm merkt sich jeden Tastendruck automatisch in deinem Browser. Öffnest
du die Seite später wieder, fragt es: *„Ungespeicherte Änderungen wiederherstellen?“* mit den
Knöpfen **„Weiter bearbeiten“** und **„Neu beginnen“**.

**Rückgängig:** Jeder Schritt lässt sich rückgängig machen – mit **Strg + Z** (am Mac
**Cmd + Z**) oder dem Knopf **„Rückgängig“** oben. Nichts geht durch einen Fehlklick verloren.

### Ohne Maus und auf dem Tablet

Der ganze Ablauf geht auch **nur mit der Tastatur** (Tabulator springt durch alle Felder und
Knöpfe, Enter aktiviert sie). Auf kleinen Bildschirmen (Tablet) klappt alles untereinander –
du musst nichts waagerecht verschieben.

---

## Auf GitHub Pages veröffentlichen

Die Datei `.github/workflows/pages.yml` baut bei jedem Einliefern (Push auf den Zweig `main`)
die Anwendung, führt die Unit-Tests aus und veröffentlicht das Ergebnis automatisch auf
**GitHub Pages**.

**Einrichtung im GitHub-Repository (einmalig):**

1. Im Repository oben auf **„Settings“** klicken.
2. Links im Menü auf **„Pages“** klicken.
3. Bei **„Source“** (Quelle) auswählen: **„GitHub Actions“**.
4. Speichern.

**Wohin führt die Adresse?** Auf
`https://<dein-github-name>.github.io/Lieder-Editor/` – also hier:
`https://gschmalzhaf-cell.github.io/Lieder-Editor/`. Der Basispfad (`/Lieder-Editor/`) wird
beim Bauen automatisch aus dem Repository-Namen abgeleitet (`vite.config.ts`).

Nach dem ersten Push auf `main` (oder über **Actions → „Bauen, prüfen und auf GitHub Pages
veröffentlichen“ → „Run workflow“**) ist die Seite nach wenigen Minuten online.

---

## Eigene Lieder als Prüfdateien legen

Im Verzeichnis `tests/fixtures/` liegen Beispieldateien (erfundene und echte Lieder). So legst
du eigene echte Lieddateien als Prüfdateien an:

1. Kopiere die `.sng`-Datei in den Ordner `tests/fixtures/` (z. B. als `mein-lied.sng`).
2. Füge sie dem Git-Repository hinzu (`git add tests/fixtures/mein-lied.sng`) und liefere ein.
3. Beim nächsten Ablauf liest der Test die Datei automatisch mit, schreibt sie wieder aus und
   prüft, ob sie **zeichenweise identisch** bleibt.

Die kodierten Varianten (Windows-1252, UTF-16, BOM, CRLF) kannst du mit
`node tools/make-fixtures.mjs` neu erzeugen.

---

## In SongBeamer selbst nachprüfen

So testest du, ob SongBeamer eine Datei aus dem Editor laden kann:

1. Erstelle im Editor ein Lied mit mindestens **Strophe, Refrain und Bridge** und klicke
   **„Als Datei speichern“**.
2. Öffne SongBeamer auf einem Windows-Rechner.
3. Menü **„Datei → Öffnen“** (oder **„Lieder“ → Lied importieren**) und wähle die heruntergeladene
   `.sng`-Datei aus.
4. Das Lied erscheint in der Liederliste; beim Öffnen siehst du die Abschnitte (Vers 1,
   Refrain, Bridge) und kannst die Folien durchblättern.

Tipp: Lege die Datei alternativ in den Liederordner von SongBeamer und starte SongBeamer neu.

---

## Tests lokal ausführen

Voraussetzung: Node.js (Version 22 oder neuer) ist installiert.

```bash
npm install     # einmalig: Abhängigkeiten laden
npm run test    # Unit-Tests (Lesen/Schreiben der Dateien, Rundläufe, Zeichensätze)
npm run dev     # Entwicklungsserver starten (localhost:5173)
npm run build   # Produktionsbau nach dist/
```

Die Tests prüfen unter anderem: Rundlauf unverändert (jede Prüfdatei wird gelesen und
byte-identisch wieder ausgegeben), Rundlauf nach einer Änderung, Windows-1252 mit ä/ö/ü/ß,
UTF-16, unbekannte Kopfzeilen, mehrsprachige Dateien und die Klartext-Meldungen vor dem
Speichern.

---

## Annahmen zum Dateiformat (Begleittext)

Wo die Formatbeschreibung Spielraum ließ, wurde der einfachste Fall gewählt:

- **Teilname erkennen:** Steht direkt nach `---` ein reservierter Name (Vers/Verse/Strophe,
  Refrain/Chorus, Bridge, Intro, Outro/Schluss/Ending, Zwischenspiel/Interlude, Pre-Chorus,
  Pre-Refrain, Teil/Part, Solo, Antwort/Response, Gesprochener Text/Speech, Tag, Coda,
  Unbekannt/Unknown/Misc – jeweils mit optionaler Nummer oder Buchstabe, z. B. „Vers 1“, „Teil A“,
  oder mit `$$M=…` für eigene Namen), wird diese Zeile als Teilname gelesen. Sonst beginnt dort
  direkt der Text (Teil ohne Namen).
- **Namen bleiben erhalten:** Beim Lesen übernommene Namen (z. B. „Strophe 1“, „Chorus“) werden
  1:1 wieder ausgegeben. Neu angelegte Strophen heißen automatisch „Vers 1“, „Vers 2“, …; beim
  „Teil wiederholen“ wird der Name mitgeführt (zweiter Abschnitt mit gleichem Namen).
- **Kopfdaten-Schlüssel:** Titel → `#Title`, Autor → `#Author`, Melodie → `#Melody`,
  Liednummer → `#CCLI`, Copyright → `#(c)` (beim Lesen werden auch `#Copyright` und
  `#SongNumber` erkannt), Notizen → `#Comment`. Beim Schreiben neuer/Geänderter Dateien
  beginnt der Kopf mit `#Title`, dann die weiteren bekannten Angaben, dann alle unbekannten
  Angaben in ursprünglicher Reihenfolge; `#LangCount=1` und `#Version=3` werden ergänzt,
  falls nicht vorhanden.
- **Zeichensatz:** Lesen erkennt UTF-8 (mit/ohne BOM), UTF-16 (LE/BE, mit BOM) und fällt
  sonst auf Windows-1252 zurück. Schreiben ist immer UTF-8 – neu erzeugte Dateien und Dateien,
  die nicht als UTF-8 gelesen wurden, bekommen ein BOM, damit SongBeamer sie sicher als UTF-8
  erkennt. UTF-8-Dateien ohne BOM bleiben beim Rundlauf ohne BOM (zeichengetreu).
- **Zeilenenden:** Windows (CRLF) und Unix (LF) werden erkannt und mitgeführt; neu erzeugte
  Dateien bekommen CRLF (Windows-Standard von SongBeamer). Am Dateiende steht bei neuen
  Dateien eine Leerzeile.
- **Weiche Folienumbrüche** (`--`, `--A`) und **Zeilen-Präfixe** (`#H `, `#1 ` …) im Text
  werden als reiner Text behandelt und unverändert wieder ausgegeben. Dasselbe gilt für
  HTML-artige Auszeichnungen (`<b>…</b>`, `<br>`, `<c:$…>` …).
- **Mehrsprachige Dateien** (`#LangCount` > 1) werden vollständig übernommen und unverändert
  wieder ausgegeben; der Editor weist mit einem Hinweis darauf hin. (Die Zeilen der Sprachen
  wechseln sich zeilenweise ab – beim Bearbeiten einzelner Zeilen kann diese Zuordnung
  durcheinandergeraten, deshalb der Hinweis.)
- **„Übernehmen“** bedeutet: Der Text einer Karte wird in die Zwischenablage kopiert, um ihn in
  eine andere Karte einzufügen.

---

## Technik (kurz)

- Statische Web-App mit **React + TypeScript**, gebaut mit **Vite**.
- Ziehen und Verschieben: **@dnd-kit** (kleine, gepflegte Bibliothek).
- Unit-Tests mit **Vitest**.
- Veröffentlichung über **GitHub Actions** auf GitHub Pages (siehe oben).

Projektstruktur:

```
index.html            Einstieg
src/sng/              Lesen und Schreiben der .sng-Dateien (reine Logik, ohne UI)
  decode.ts           Zeichensatz-Erkennung (UTF-8, UTF-16, Windows-1252)
  parse.ts            Leser: Datei -> Datenmodell
  serialize.ts        Schreiber: Datenmodell -> Datei
  names.ts            Teilnamen (deutsch/englisch) erkennen und erzeugen
  validate.ts         Klartext-Prüfung vor dem Speichern
  filename.ts         Dateiname aus dem Titel
src/ui/               Oberfläche (Startseite, Editor, Karten, Vorschau)
src/state/            Rückgängig-Verlauf und automatisches Speichern im Browser
tests/                Unit-Tests
tests/fixtures/       Prüfdateien (Beispiele und echte Lieder)
tools/make-fixtures.mjs  Erzeugt die kodierten Prüfdateien
.github/workflows/    GitHub-Actions-Ablauf (Bauen, Tests, Pages)
docs/                 Bilder für diese Anleitung
```
