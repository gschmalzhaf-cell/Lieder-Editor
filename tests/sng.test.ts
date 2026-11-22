import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createEmptySong,
  decodeBytes,
  encodeSong,
  getHeaderValue,
  nameForNewPart,
  nextPartId,
  parseSectionName,
  parseSongBytes,
  serializeSong,
  sngFilename,
  validateSong,
} from '../src/sng';
import type { Part, Song } from '../src/sng';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');

function fixtureBytes(name: string): Uint8Array {
  return new Uint8Array(readFileSync(join(fixturesDir, name)));
}

function fixtureText(name: string): string {
  return readFileSync(join(fixturesDir, name), 'utf8');
}

// Prüfdateien, die als UTF-8 (mit/ohne BOM) vorliegen und byte-genau
// wieder ausgegeben werden müssen.
const UTF8_FIXTURES = [
  'beispiel-einfach.sng',
  'beispiel-bom.sng',
  'beispiel-crlf.sng',
  'beispiel-strophennamen.sng',
  'beispiel-unbekannte-kopfzeilen.sng',
  'beispiel-mehrsprachig.sng',
  'beispiel-html-tags.sng',
  'beispiel-leerzeilen.sng',
];

describe('Rundlauf unverändert (Lesen und wieder Schreiben)', () => {
  for (const name of UTF8_FIXTURES) {
    it(`byte-identisch: ${name}`, () => {
      const bytes = fixtureBytes(name);
      const { song } = parseSongBytes(bytes);
      const out = encodeSong(song);
      expect(Buffer.from(out).equals(Buffer.from(bytes))).toBe(true);
    });
  }
});

describe('Zeichensätze', () => {
  it('Windows-1252 mit Umlauten wird richtig gelesen', () => {
    const bytes = fixtureBytes('beispiel-umlaute-cp1252.sng');
    const decoded = decodeBytes(bytes);
    expect(decoded.encoding).toBe('windows-1252');
    expect(decoded.text).toContain('Grüße aus Köln');
    expect(decoded.text).toContain('ä ö ü ß');
    expect(decoded.text).toContain('Köln liegt am Rhein');

    // Nach dem Schreiben (UTF-8) lesen wir dieselben Zeichen wieder ein.
    const { song } = parseSongBytes(bytes);
    const again = decodeBytes(encodeSong(song));
    expect(again.text).toBe(decoded.text);
    expect(again.encoding).toBe('utf-8-bom'); // BOM der neuen Datei
  });

  it('UTF-16 LE mit BOM wird richtig gelesen', () => {
    const bytes = fixtureBytes('beispiel-utf16le.sng');
    const decoded = decodeBytes(bytes);
    expect(decoded.encoding).toBe('utf-16le');
    expect(decoded.text).toContain('#Title=Umlaute in UTF-16');
    expect(decoded.text).toContain('ä ö ü ß in UTF-16');
    const { song } = parseSongBytes(bytes);
    expect(song.parts).toHaveLength(2);
    expect(song.parts[0].name).toBe('Vers 1');
    const again = decodeBytes(encodeSong(song));
    expect(again.text).toBe(decoded.text);
  });

  it('UTF-8 ohne BOM wird als UTF-8 erkannt, nicht als ANSI', () => {
    const decoded = decodeBytes(new TextEncoder().encode('ä ö ü – „Anführungszeichen“'));
    expect(decoded.encoding).toBe('utf-8');
    expect(decoded.text).toContain('ä ö ü – „Anführungszeichen“');
  });
});

describe('Rundlauf mit Änderung', () => {
  it('Teil verschieben und Text ergänzen ergibt eine erneut fehlerfrei lesbare Datei', () => {
    const { song } = parseSongBytes(fixtureBytes('beispiel-einfach.sng'));
    expect(song.parts.map((p) => p.name)).toEqual(['Vers 1', 'Refrain', 'Vers 2', 'Bridge']);

    const parts = [...song.parts];
    const [first, ...rest] = parts;
    const geaendert: Song = {
      ...song,
      parts: [...rest, first].map((p, i) =>
        i === 1 ? { ...p, lines: [...p.lines, 'Neue Zeile'] } : p,
      ),
    };

    const text = serializeSong(geaendert);
    const { song: again } = parseSongBytes(new TextEncoder().encode(text));
    expect(again.parts.map((p) => p.name)).toEqual(['Refrain', 'Vers 2', 'Bridge', 'Vers 1']);
    expect(again.parts[1].lines).toContain('Neue Zeile');
    // Schreiben ist stabil: nochmal lesen und schreiben ändert nichts mehr
    expect(serializeSong(again)).toBe(text);
  });
});

describe('Teilnamen erkennen (deutsch und englisch)', () => {
  it('reservierte Namen werden derselben Art zugeordnet', () => {
    expect(parseSectionName('Vers 1')?.type).toBe('strophe');
    expect(parseSectionName('Verse 2')?.type).toBe('strophe');
    expect(parseSectionName('Strophe 3')?.type).toBe('strophe');
    expect(parseSectionName('Refrain')?.type).toBe('refrain');
    expect(parseSectionName('Chorus 2')?.type).toBe('refrain');
    expect(parseSectionName('Bridge')?.type).toBe('bridge');
    expect(parseSectionName('Intro')?.type).toBe('intro');
    expect(parseSectionName('Outro')?.type).toBe('schluss');
    expect(parseSectionName('Schluss')?.type).toBe('schluss');
    expect(parseSectionName('Zwischenspiel')?.type).toBe('zwischenspiel');
    expect(parseSectionName('Interlude')?.type).toBe('zwischenspiel');
    expect(parseSectionName('Teil A')?.type).toBe('weiterer');
    expect(parseSectionName('$$M=Solo Gitarre')?.type).toBe('weiterer');
    expect(parseSectionName('Eine ganz normale Textzeile')).toBeNull();
  });

  it('Namen bleiben beim Schreiben erhalten (z. B. „Strophe 1“, „Chorus“)', () => {
    const { song } = parseSongBytes(fixtureBytes('beispiel-strophennamen.sng'));
    expect(song.parts.map((p) => p.type)).toEqual(['strophe', 'refrain', 'strophe']);
    expect(serializeSong(song)).toBe(fixtureText('beispiel-strophennamen.sng'));

    const englisch = parseSongBytes(fixtureBytes('beispiel-unbekannte-kopfzeilen.sng'));
    expect(englisch.song.parts.map((p) => p.type)).toEqual([
      'strophe',
      'refrain',
      'strophe',
      'bridge',
      'weiterer',
    ]);
    // Der unbenannte Teil hat keinen Namen, sein Text bleibt vollständig
    const unbenannt = englisch.song.parts[4];
    expect(unbenannt.name).toBeNull();
    expect(unbenannt.lines).toEqual([
      'Direkter Text ohne eigenen Namen',
      'Erste Zeile des unbenannten Teils',
      '',
      'Zweite Zeile des unbenannten Teils',
      '',
      '',
    ]);
  });
});

describe('Kopfzeilen', () => {
  it('unbekannte Angaben bleiben erhalten und werden unverändert ausgegeben', () => {
    const { song } = parseSongBytes(fixtureBytes('beispiel-unbekannte-kopfzeilen.sng'));
    expect(song.header.title).toBe('Englische Namen und Zusatzangaben');
    expect(song.header.songNumber).toBe('858299');
    const text = serializeSong(song);
    expect(text).toContain('#Editor=SongBeamer 4.04c');
    expect(text).toContain('#Key=F#m');
    expect(text).toContain('#VerseOrder=Verse 1,Chorus,Verse 2,Chorus,Bridge');
  });

  it('bearbeitete Kopfdaten: #Title zuerst, dann Bekannte, dann Unbekannte in Reihenfolge', () => {
    const { song } = parseSongBytes(fixtureBytes('beispiel-unbekannte-kopfzeilen.sng'));
    const geaendert: Song = {
      ...song,
      header: { ...song.header, title: 'Neuer Titel', author: 'Neuer Autor' },
      headerDirty: true,
    };
    const lines = serializeSong(geaendert).split('\n');
    expect(lines[0]).toBe('#Title=Neuer Titel');
    expect(lines[1]).toBe('#Author=Neuer Autor');
    const editorIdx = lines.findIndex((l) => l.startsWith('#Editor='));
    const keyIdx = lines.findIndex((l) => l.startsWith('#Key='));
    expect(editorIdx).toBeGreaterThan(1);
    expect(keyIdx).toBeGreaterThan(editorIdx);
    // Unbekannte bleiben in ursprünglicher Abfolge (CCLI ist bekannt und
    // steht daher direkt nach den bearbeiteten Feldern)
    expect(lines[2]).toBe('#CCLI=858299');
    expect(lines[editorIdx + 1]).toBe('#Key=F#m');
    expect(lines[keyIdx + 1]).toBe('#VerseOrder=Verse 1,Chorus,Verse 2,Chorus,Bridge');
  });

  it('LangCount wird erkannt (Mehrsprachigkeit)', () => {
    const { song } = parseSongBytes(fixtureBytes('beispiel-mehrsprachig.sng'));
    expect(getHeaderValue(song, 'langcount')).toBe('2');
    // #H-Zeilen im Text bleiben Textzeilen
    expect(song.parts[2].lines[0]).toBe('#H Hinweis: Zweite Strophe ruhig begleiten');
  });
});

describe('Neu erzeugtes Lied (Schreiben)', () => {
  function neuesLied(): Song {
    const song = createEmptySong();
    song.header.title = 'Näher, mein Gott, zu Dir';
    song.header.author = 'Sarah Flower Adams';
    const mk = (type: Part['type'], lines: string[]): Part => ({
      id: nextPartId(),
      type,
      name: nameForNewPart(type, song.parts),
      lines,
      origin: 'neu',
    });
    song.parts.push(mk('strophe', ['Erste Zeile', 'Zweite Zeile', '']));
    song.parts.push(mk('refrain', ['Refrainzeile']));
    song.parts.push(mk('bridge', ['Mittelteil']));
    return song;
  }

  it('erzeugt eine gültige Datei: #Title zuerst, --- je Teil, Leerzeile am Ende, UTF-8 mit BOM', () => {
    const song = neuesLied();
    expect(song.parts.map((p) => p.name)).toEqual(['Vers 1', 'Refrain', 'Bridge']);
    const text = serializeSong(song);
    const eol = '\r\n';
    expect(text.startsWith(`#Title=Näher, mein Gott, zu Dir${eol}`)).toBe(true);
    expect(text).toContain(`${eol}---${eol}Vers 1${eol}Erste Zeile${eol}`);
    expect(text).toContain(`---${eol}Refrain${eol}`);
    expect(text).toContain(`---${eol}Bridge${eol}`);
    expect(text.endsWith(`${eol}${eol}`)).toBe(true); // Leerzeile am Dateiende
    expect(text).toContain('#LangCount=1');
    expect(text).toContain('#Version=3');

    const bytes = encodeSong(song);
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf]); // UTF-8-BOM
    const { song: again } = parseSongBytes(bytes);
    expect(again.parts.map((p) => [p.type, p.name])).toEqual([
      ['strophe', 'Vers 1'],
      ['refrain', 'Refrain'],
      ['bridge', 'Bridge'],
    ]);
    expect(again.header.title).toBe('Näher, mein Gott, zu Dir');
    expect(validateSong(again)).toEqual([]);
  });

  it('Dateiname entsteht aus dem Titel ohne Sonderzeichen', () => {
    expect(sngFilename('Näher, mein Gott, zu Dir')).toBe('Näher_mein_Gott_zu_Dir.sng');
    expect(sngFilename('  ')).toBe('lied.sng');
    expect(sngFilename('Jesus! (EG 316)')).toBe('Jesus_EG_316.sng');
  });

  it('automatische Nummerierung bei Strophe und Refrain', () => {
    const song = createEmptySong();
    expect(nameForNewPart('strophe', song.parts)).toBe('Vers 1');
    song.parts.push({ id: 'a', type: 'strophe', name: 'Vers 1', lines: ['x'], origin: 'neu' });
    expect(nameForNewPart('strophe', song.parts)).toBe('Vers 2');
    expect(nameForNewPart('refrain', song.parts)).toBe('Refrain');
    song.parts.push({ id: 'b', type: 'refrain', name: 'Refrain', lines: ['x'], origin: 'neu' });
    expect(nameForNewPart('refrain', song.parts)).toBe('Refrain 2');
  });
});

describe('Prüfung vor dem Speichern (Klartext-Meldungen)', () => {
  it('fehlender Titel und fehlende Teile', () => {
    const song = createEmptySong();
    expect(validateSong(song)).toEqual([
      'Bitte gib dem Lied noch einen Titel.',
      'Das Lied hat noch keine Teile. Füge eine Strophe hinzu.',
    ]);
    song.header.title = 'Titel';
    expect(validateSong(song)).toEqual([
      'Das Lied hat noch keine Teile. Füge eine Strophe hinzu.',
    ]);
  });

  it('leere Karte und Karte mit nur Leerzeilen', () => {
    const song = createEmptySong();
    song.header.title = 'Titel';
    song.parts.push({ id: '1', type: 'strophe', name: 'Vers 2', lines: [], origin: 'neu' });
    song.parts.push({ id: '2', type: 'refrain', name: 'Refrain', lines: ['', '   '], origin: 'neu' });
    expect(validateSong(song)).toEqual([
      'Die Strophe 2 ist noch leer. Fülle sie oder lösch sie.',
      'Im Refrain stehen nur leere Zeilen.',
    ]);
  });
});
