import { formatSectionNameForFile } from './names';
import { isKnownHeaderKey, parseHeaderKey, getHeaderValue } from './parse';
import type { HeaderFields, Song } from './types';

/** Kanonische Schlüssel der bearbeitbaren Kopf-Felder, in Schreibreihenfolge. */
const HEADER_ORDER: (keyof HeaderFields)[] = [
  'title',
  'author',
  'melody',
  'songNumber',
  'copyright',
  'notes',
];

const HEADER_KEY: Record<keyof HeaderFields, string> = {
  title: 'Title',
  author: 'Author',
  melody: 'Melody',
  songNumber: 'CCLI',
  copyright: '(c)',
  notes: 'Comment',
};

function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, ' ');
}

function resolveSongNumberKey(song: Song, value: string): string {
  if (song.songNumberKey) {
    const lower = song.songNumberKey.toLowerCase();
    if (lower === 'songbook') return 'Songbook';
    if (lower === 'churchsongid') return 'ChurchSongID';
    if (lower === 'ccli') return 'CCLI';
  }
  // Reine Ziffern -> #CCLI, Liederbuch-Angaben mit Buchstaben (z. B. „EG 331“) -> #Songbook
  return /^\d+$/.test(value.trim()) ? 'CCLI' : 'Songbook';
}

/**
 * Kopfzeilen neu aufbauen (nach Änderung im Editor):
 * #Title zuerst, dann die weiteren bekannten Angaben, danach die
 * unbekannten Angaben in ihrer ursprünglichen Reihenfolge.
 */
export function buildHeaderLines(song: Song): string[] {
  const lines: string[] = [];
  for (const field of HEADER_ORDER) {
    const value = song.header[field];
    if (value.trim() !== '') {
      const key = field === 'songNumber' ? resolveSongNumberKey(song, value) : HEADER_KEY[field];
      lines.push(`#${key}=${oneLine(value)}`);
    }
  }
  for (const raw of song.headerRaw) {
    const kv = parseHeaderKey(raw);
    if (kv && isKnownHeaderKey(kv.key, song.songNumberKey)) continue;
    lines.push(raw);
  }
  if (getHeaderValue(song, 'langcount') === null) lines.push('#LangCount=1');
  if (getHeaderValue(song, 'version') === null) lines.push('#Version=3');
  return lines;
}

/**
 * Datenmodell als SNG-Text schreiben.
 * Wurde das Lied nur gelesen und nicht am Kopf verändert, bleiben die
 * Kopfzeilen zeichengetreu erhalten (Rundlauf unverändert).
 */
export function serializeSong(song: Song): string {
  const eol = song.lineEnding;
  const out: string[] = [];
  out.push(...(song.headerDirty ? buildHeaderLines(song) : song.headerRaw));
  for (const part of song.parts) {
    out.push('---');
    if (part.name !== null && part.name.trim() !== '') {
      // Unveränderte Dateiteile bleiben byte-identisch; neue/umbenannte Teile bekommen ggf. $$M=
      out.push(part.origin === 'datei' ? part.name : formatSectionNameForFile(part.name));
    }
    out.push(...part.lines);
  }
  if (song.origin === 'neu') {
    // Am Dateiende eine Leerzeile
    while (out.length === 0 || out[out.length - 1] !== '') out.push('');
    if (out.length < 2 || out[out.length - 2] !== '') out.push('');
  }
  return out.join(eol);
}

/** Als UTF-8 kodieren (mit BOM, falls die Quelldatei eines hatte bzw. neu angelegt). */
export function encodeSong(song: Song): Uint8Array {
  const body = new TextEncoder().encode(serializeSong(song));
  if (!song.utf8Bom) return body;
  const out = new Uint8Array(body.length + 3);
  out.set([0xef, 0xbb, 0xbf], 0);
  out.set(body, 3);
  return out;
}
