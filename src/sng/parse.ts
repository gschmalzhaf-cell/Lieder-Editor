import { decodeBytes, detectLineEnding, splitLines } from './decode';
import { parseSectionName } from './names';
import { emptyHeader, nextPartId } from './types';
import type { HeaderFields, Part, PartType, Song } from './types';

/**
 * Bekannte Kopfzeilen des Editors. Beim Lesen sind die Schlüssel
 * (kleingeschrieben) den Feldern zugeordnet; Beim Schreiben wird der
 * kanonische Schlüssel verwendet. `#(c)` und `#Copyright` sind beide
 * Copyright-Angaben, `#CCLI` ist die Liednummer.
 */
const KNOWN_HEADER_FIELDS: Record<string, keyof HeaderFields> = {
  title: 'title',
  author: 'author',
  melody: 'melody',
  ccli: 'songNumber',
  songnumber: 'songNumber',
  '(c)': 'copyright',
  copyright: 'copyright',
  comment: 'notes',
};

export function parseHeaderKey(line: string): { key: string; value: string } | null {
  if (!line.startsWith('#')) return null;
  const eq = line.indexOf('=');
  if (eq <= 1) return null;
  return { key: line.slice(1, eq).trim(), value: line.slice(eq + 1) };
}

export function isKnownHeaderKey(key: string): boolean {
  return Object.hasOwn(KNOWN_HEADER_FIELDS, key.toLowerCase());
}

/** Wert einer Kopfzeile aus den Rohzeilen holen (z. B. langcount). */
export function getHeaderValue(song: Song, key: string): string | null {
  for (const raw of song.headerRaw) {
    const kv = parseHeaderKey(raw);
    if (kv && kv.key.toLowerCase() === key.toLowerCase()) return kv.value;
  }
  return null;
}

/**
 * SNG-Text in das Datenmodell lesen.
 * Alles vor dem ersten `---` sind Kopfzeilen (roh, unverändert aufbewahrt).
 * Jedes `---` beginnt einen Teil; die nächste Zeile ist der Teilname, falls
 * sie ein reservierter Name ist, sonst beginnt dort direkt der Text.
 */
export function parseSong(text: string, opts?: { utf8Bom?: boolean }): Song {
  const lines = splitLines(text);
  const headerRaw: string[] = [];
  const header = emptyHeader();

  let i = 0;
  while (i < lines.length && lines[i] !== '---') {
    headerRaw.push(lines[i]);
    const kv = parseHeaderKey(lines[i]);
    if (kv) {
      const field = KNOWN_HEADER_FIELDS[kv.key.toLowerCase()];
      if (field && header[field] === '') header[field] = kv.value;
    }
    i += 1;
  }

  const parts: Part[] = [];
  while (i < lines.length) {
    // lines[i] === '---'
    i += 1;
    let name: string | null = null;
    let type: PartType = 'weiterer';
    if (i < lines.length && lines[i] !== '---') {
      const info = parseSectionName(lines[i]);
      if (info) {
        name = lines[i];
        type = info.type;
        i += 1;
      }
    }
    const partLines: string[] = [];
    while (i < lines.length && lines[i] !== '---') {
      partLines.push(lines[i]);
      i += 1;
    }
    parts.push({ id: nextPartId(), type, name, lines: partLines, origin: 'datei' });
  }

  return {
    header,
    headerRaw,
    headerDirty: false,
    parts,
    lineEnding: detectLineEnding(text),
    utf8Bom: opts?.utf8Bom ?? false,
    origin: 'datei',
  };
}

export function parseSongBytes(bytes: Uint8Array): { song: Song; encoding: string } {
  const decoded = decodeBytes(bytes);
  // War die Quelle kein UTF-8 (z. B. Windows-1252 oder UTF-16), geben wir beim
  // Schreiben ein BOM aus, damit SongBeamer die Datei zuverlässig als UTF-8
  // erkennt und nicht auf ANSI zurückfällt. UTF-8-Quellen behalten ihr BOM
  // bzw. bleiben ohne BOM (Rundlauf zeichengetreu).
  const utf8Bom =
    decoded.utf8Bom || (decoded.encoding !== 'utf-8' && decoded.encoding !== 'utf-8-bom');
  const song = parseSong(decoded.text, { utf8Bom });
  return { song, encoding: decoded.encoding };
}
