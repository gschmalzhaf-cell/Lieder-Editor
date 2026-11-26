export type PartType =
  | 'strophe'
  | 'refrain'
  | 'bridge'
  | 'intro'
  | 'schluss'
  | 'zwischenspiel'
  | 'weiterer';

export type PartOrigin = 'neu' | 'wiederholung' | 'datei';

export interface Part {
  id: string;
  type: PartType;
  /** Name des Teils in der Datei, z. B. „Vers 1“, „Refrain“, „Bridge“. null = Teil ohne Namen. */
  name: string | null;
  /** Textzeilen des Teils. Eine leere Zeile („“) erzeugt Abstand auf der Folie. */
  lines: string[];
  origin: PartOrigin;
}

export interface HeaderFields {
  title: string;
  author: string;
  melody: string;
  songNumber: string;
  copyright: string;
  notes: string;
}

export type LineEnding = '\r\n' | '\n' | '\r';

export interface Song {
  header: HeaderFields;
  /** Kopfzeilen genau so, wie sie gelesen wurden (inkl. unbekannter Angaben). */
  headerRaw: string[];
  /** true, sobald jemand ein Kopf-Feld im Editor ändert (dann wird der Kopf neu aufgebaut). */
  headerDirty: boolean;
  parts: Part[];
  lineEnding: LineEnding;
  utf8Bom: boolean;
  origin: 'neu' | 'datei';
}

export function emptyHeader(): HeaderFields {
  return {
    title: '',
    author: '',
    melody: '',
    songNumber: '',
    copyright: '',
    notes: '',
  };
}

export function createEmptySong(): Song {
  return {
    header: emptyHeader(),
    headerRaw: [],
    headerDirty: true,
    parts: [],
    // SongBeamer läuft auf Windows: neue Dateien bekommen CRLF und UTF-8 mit BOM.
    lineEnding: '\r\n',
    utf8Bom: true,
    origin: 'neu',
  };
}

let idCounter = 0;
export function nextPartId(): string {
  idCounter += 1;
  return `teil-${Date.now().toString(36)}-${idCounter}`;
}
