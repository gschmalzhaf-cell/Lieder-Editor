import type { LineEnding } from './types';

export type EncodingName =
  | 'utf-8'
  | 'utf-8-bom'
  | 'utf-16le'
  | 'utf-16be'
  | 'windows-1252';

export interface DecodedText {
  text: string;
  encoding: EncodingName;
  utf8Bom: boolean;
}

/**
 * Zeichensatz erkennen und dekodieren:
 * 1. Byte-Order-Mark (BOM) prüfen: UTF-8, UTF-16 LE, UTF-16 BE.
 * 2. Sonst strenger UTF-8-Versuch.
 * 3. Fällt der fehl, Rückgriff auf Windows-1252 (ANSI, alte SongBeamer-Dateien).
 */
export function decodeBytes(bytes: Uint8Array): DecodedText {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return {
      text: new TextDecoder('utf-8').decode(bytes.subarray(3)),
      encoding: 'utf-8-bom',
      utf8Bom: true,
    };
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return {
      text: new TextDecoder('utf-16le').decode(bytes.subarray(2)),
      encoding: 'utf-16le',
      utf8Bom: false,
    };
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return {
      text: new TextDecoder('utf-16be').decode(bytes.subarray(2)),
      encoding: 'utf-16be',
      utf8Bom: false,
    };
  }
  try {
    return {
      text: new TextDecoder('utf-8', { fatal: true }).decode(bytes),
      encoding: 'utf-8',
      utf8Bom: false,
    };
  } catch {
    return {
      text: new TextDecoder('windows-1252').decode(bytes),
      encoding: 'windows-1252',
      utf8Bom: false,
    };
  }
}

/** Text in Zeilen zerlegen. Windows- (CRLF/CR) und Unix-Zeilenenden (LF) werden erkannt. */
export function splitLines(text: string): string[] {
  return text.split(/\r\n|\r|\n/);
}

/** Zeilenende der Datei erkennen (erstes vorkommendes Muster gewinnt). */
export function detectLineEnding(text: string): LineEnding {
  if (text.includes('\r\n')) return '\r\n';
  if (text.includes('\r')) return '\r';
  return '\n';
}
