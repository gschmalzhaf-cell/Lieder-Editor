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
  titleLang2: string;
  originalTitle: string;
  author: string;
  melody: string;
  translation: string;
  songNumber: string;
  songbook: string;
  churchSongId: string;
  copyright: string;
  rights: string;
  key: string;
  timeSignature: string;
  tempo: string;
  categories: string;
  keywords: string;
  bible: string;
  notes: string;
}

export type LineEnding = '\r\n' | '\n' | '\r';

export interface Song {
  header: HeaderFields;
  /** Kopfzeilen genau so, wie sie gelesen wurden (inkl. unbekannter Angaben). */
  headerRaw: string[];
  /** Ursprünglicher Schlüssel für Taktart (#Time oder #TimeSignature), falls aus Datei gelesen. */
  timeSignatureKey?: string;
  /** Anzahl der Sprachen (1 = einsprachig, 2 = zweisprachig, ...). */
  langCount: number;
  /** Abspielreihenfolge (#VerseOrder), z. B. ['Vers 1', 'Refrain', 'Vers 2', 'Refrain']. */
  verseOrder: string[];
  /** true, sobald jemand ein Kopf-Feld, Sprachen oder Reihenfolge im Editor ändert. */
  headerDirty: boolean;
  parts: Part[];
  lineEnding: LineEnding;
  utf8Bom: boolean;
  origin: 'neu' | 'datei';
}

export function emptyHeader(): HeaderFields {
  return {
    title: '',
    titleLang2: '',
    originalTitle: '',
    author: '',
    melody: '',
    translation: '',
    songNumber: '',
    songbook: '',
    churchSongId: '',
    copyright: '',
    rights: '',
    key: '',
    timeSignature: '',
    tempo: '',
    categories: '',
    keywords: '',
    bible: '',
    notes: '',
  };
}

export function createEmptySong(): Song {
  return {
    header: emptyHeader(),
    headerRaw: [],
    langCount: 1,
    verseOrder: [],
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
