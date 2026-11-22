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

/**
 * Kopfzeilen neu aufbauen (nach Änderung im Editor):
 * #Title zuerst, dann die weiteren bekannten Angaben, danach die
 * unbekannten Angaben in ihrer ursprünglichen Reihenfolge.
 */
export function buildHeaderLines(song: Song): string[] {
  const lines: string[] = [];
  for (const field of HEADER_ORDER) {
    const value = song.header[field];
    if (value.trim() !== '') lines.push(`#${HEADER_KEY[field]}=${oneLine(value)}`);
  }
  for (const raw of song.headerRaw) {
    const kv = parseHeaderKey(raw);
    if (kv && isKnownHeaderKey(kv.key)) continue;
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
    if (part.name !== null && part.name.trim() !== '') out.push(part.name);
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
