import { formatSectionNameForFile } from './names';
import { isKnownHeaderKey, parseHeaderKey, getHeaderValue } from './parse';
import type { HeaderFields, Song } from './types';

/** Kanonische Schlüssel der bearbeitbaren Kopf-Felder, in Schreibreihenfolge. */
const HEADER_ORDER: (keyof HeaderFields)[] = [
  'title',
  'titleLang2',
  'originalTitle',
  'author',
  'melody',
  'translation',
  'songNumber',
  'songbook',
  'churchSongId',
  'copyright',
  'rights',
  'key',
  'timeSignature',
  'tempo',
  'categories',
  'keywords',
  'bible',
  'notes',
];

const HEADER_KEY: Record<keyof HeaderFields, string> = {
  title: 'Title',
  titleLang2: 'TitleLang2',
  originalTitle: 'OTitle',
  author: 'Author',
  melody: 'Melody',
  translation: 'Translation',
  songNumber: 'CCLI',
  songbook: 'Songbook',
  churchSongId: 'ChurchSongID',
  copyright: '(c)',
  rights: 'Rights',
  key: 'Key',
  timeSignature: 'Time',
  tempo: 'Tempo',
  categories: 'Categories',
  keywords: 'Keywords',
  bible: 'Bible',
  notes: 'Comment',
};

function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, ' ');
}

/**
 * Kopfzeilen neu aufbauen (nach Änderung im Editor):
 * #Title zuerst, dann die weiteren bekannten Angaben, #VerseOrder, danach die
 * unbekannten Angaben in ihrer ursprünglichen Reihenfolge, sowie #LangCount und #Version.
 */
export function buildHeaderLines(song: Song): string[] {
  const lines: string[] = [];
  for (const field of HEADER_ORDER) {
    const value = song.header[field];
    if (value.trim() !== '') {
      let key = HEADER_KEY[field];
      if (field === 'timeSignature' && song.timeSignatureKey) {
        key = song.timeSignatureKey;
      } else if (field === 'songNumber' && !/^\d+$/.test(value.trim()) && song.header.songbook.trim() === '') {
        key = 'Songbook';
      }
      lines.push(`#${key}=${oneLine(value)}`);
    }
  }
  if (song.verseOrder.length > 0) {
    lines.push(`#VerseOrder=${song.verseOrder.map(oneLine).join(',')}`);
  }
  for (const raw of song.headerRaw) {
    const kv = parseHeaderKey(raw);
    if (kv && isKnownHeaderKey(kv.key)) continue;
    lines.push(raw);
  }
  lines.push(`#LangCount=${Math.max(1, song.langCount || 1)}`);
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
