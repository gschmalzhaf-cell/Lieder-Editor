// Erzeugt die kodierten Prüfdateien in tests/fixtures aus den Klartext-Basisen.
// Aufruf: node tools/make-fixtures.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixtures = join(dirname(fileURLToPath(import.meta.url)), '..', 'tests', 'fixtures');

const einfach = readFileSync(join(fixtures, 'beispiel-einfach.sng'), 'utf8');

// Windows-Zeilenenden (CRLF)
writeFileSync(
  join(fixtures, 'beispiel-crlf.sng'),
  Buffer.from(einfach.replace(/\n/g, '\r\n'), 'utf8'),
);

// UTF-8 mit BOM (Vorspann EF BB BF), wie SongBeamer ab Version 6 schreibt
writeFileSync(
  join(fixtures, 'beispiel-bom.sng'),
  Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(einfach, 'utf8')]),
);

// Windows-1252 (ANSI) mit Sonderbuchstaben – ä ö ü ß liegen in Latin-1/cp1252
// auf denselben Bytewerten, daher ist latin1 hier identisch zu Windows-1252.
const cp1252Text = [
  '#Title=Grüße aus Köln',
  '#Author=Bärbel Müller',
  '#LangCount=1',
  '#Version=3',
  '---',
  'Vers 1',
  'Schöne Grüße: ä ö ü ß',
  'Köln liegt am Rhein',
  '',
  '---',
  'Refrain',
  'Viel Spaß beim Singen!',
  '',
  '',
].join('\r\n');
writeFileSync(join(fixtures, 'beispiel-umlaute-cp1252.sng'), Buffer.from(cp1252Text, 'latin1'));

// UTF-16 LE mit BOM
const utf16Text = [
  '#Title=Umlaute in UTF-16',
  '#LangCount=1',
  '#Version=3',
  '---',
  'Vers 1',
  'ä ö ü ß in UTF-16',
  '',
  '---',
  'Refrain',
  'Ende der Datei',
  '',
  '',
].join('\r\n');
writeFileSync(
  join(fixtures, 'beispiel-utf16le.sng'),
  Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(utf16Text, 'utf16le')]),
);

console.log('Prüfdateien erzeugt.');
