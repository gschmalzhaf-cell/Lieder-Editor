import type { Part, PartType } from './types';

export interface SectionNameInfo {
  type: PartType;
  number: number | null;
}

/**
 * Offizielle, von SongBeamer direkt erkannte Abschnittsnamen (deutsch und englisch).
 * Nur diese Namen erkennt SongBeamer ohne `$$M=`-Präfix als Folienbezeichner.
 */
const NATIVE_FIXED_NAMES: Record<string, PartType> = {
  bridge: 'bridge',
  brücke: 'bridge',
  intro: 'intro',
  outro: 'schluss',
  schluss: 'schluss',
  ending: 'schluss',
  zwischenspiel: 'zwischenspiel',
  interlude: 'zwischenspiel',
  instrumental: 'zwischenspiel',
  'pre-chorus': 'weiterer',
  'pre chorus': 'weiterer',
  'pre-refrain': 'weiterer',
  'pre refrain': 'weiterer',
  'pre-bridge': 'weiterer',
  'pre bridge': 'weiterer',
  'pre-coda': 'weiterer',
  'pre coda': 'weiterer',
  teil: 'weiterer',
  part: 'weiterer',
  unbekannt: 'weiterer',
  unknown: 'weiterer',
  unbenannt: 'weiterer',
  misc: 'weiterer',
  coda: 'weiterer',
  tag: 'weiterer',
  chor: 'weiterer',
};

/**
 * Zusätzliche sprechende Namen aus älteren Dateien, die der Leser ebenfalls als
 * Teilnamen erkennt (beim Schreiben neuer/geänderter Teile bekommen sie `$$M=`,
 * damit SongBeamer sie nicht als Liedtext projiziert).
 */
const EXTRA_RECOGNIZED_NAMES: Record<string, PartType> = {
  'gesprochener text': 'weiterer',
  speech: 'weiterer',
  talk: 'weiterer',
  antwort: 'weiterer',
  response: 'weiterer',
  solo: 'weiterer',
  übergang: 'weiterer',
  transition: 'weiterer',
};

function normalize(line: string): string {
  return line
    .trim()
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ');
}

function isMarkerSuffix(token: string): boolean {
  return /^\d+[a-z]?$/.test(token) || /^[a-z]$/.test(token);
}

/** Prüft, ob ein Name von SongBeamer direkt (ohne `$$M=`) als Folienmarker erkannt wird. */
export function isNativeSongBeamerMarker(raw: string): boolean {
  const line = normalize(raw);
  if (line === '') return false;
  if (/^(vers|verse|strophe)(\s+(\d+[a-z]?|[a-z])|\d+[a-z]?)?$/.test(line)) return true;
  if (/^(refrain|chorus)(\s+(\d+[a-z]?|[a-z])|\d+[a-z]?)?$/.test(line)) return true;

  const words = line.split(' ');
  const last = words[words.length - 1];
  const base = isMarkerSuffix(last) && words.length > 1 ? words.slice(0, -1).join(' ') : line;
  return Object.hasOwn(NATIVE_FIXED_NAMES, base);
}

/** Entfernt ein technisches `$$M=`-Präfix, damit der Nutzer niemals Rohformat sieht. */
export function cleanSectionName(raw: string | null): string {
  if (!raw) return '';
  return raw.replace(/^\$\$M=/i, '');
}

/**
 * Bereitet einen Teilnamen für das Schreiben in eine .sng-Datei auf:
 * Offizielle SongBeamer-Marker bleiben unverändert; eigene Namen bekommen `$$M=`,
 * damit SongBeamer sie sicher als Foliennamen erkennt und nicht als Liedtext anzeigt.
 */
export function formatSectionNameForFile(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === '') return '';
  if (/^\$\$M=/i.test(trimmed)) return trimmed;
  if (isNativeSongBeamerMarker(trimmed)) return trimmed;
  return `$$M=${trimmed}`;
}

export function parseSectionName(raw: string): SectionNameInfo | null {
  const line = normalize(raw);
  if (line === '') return null;
  if (line.startsWith('$$m=')) {
    const inner = line.slice(4).trim();
    if (inner === '') return { type: 'weiterer', number: null };
    const innerInfo = parseSectionName(inner);
    return innerInfo ?? { type: 'weiterer', number: null };
  }

  let m = /^(vers|verse|strophe)\s*(\d+[a-z]?|[a-z])?$/.exec(line);
  if (m) {
    const numMatch = m[2] ? /^(\d+)/.exec(m[2]) : null;
    return { type: 'strophe', number: numMatch ? Number(numMatch[1]) : null };
  }
  m = /^(refrain|chorus)\s*(\d+[a-z]?|[a-z])?$/.exec(line);
  if (m) {
    const numMatch = m[2] ? /^(\d+)/.exec(m[2]) : null;
    return { type: 'refrain', number: numMatch ? Number(numMatch[1]) : null };
  }

  const words = line.split(' ');
  const last = words[words.length - 1];
  const base = isMarkerSuffix(last) && words.length > 1 ? words.slice(0, -1).join(' ') : line;
  const type = NATIVE_FIXED_NAMES[base] ?? EXTRA_RECOGNIZED_NAMES[base];
  if (type) return { type, number: null };
  return null;
}

/** Anzeigename einer Karte in Klartext, z. B. „Strophe 2“ oder „Refrain“. */
export function partDisplayName(part: Part, index: number): string {
  const clean = cleanSectionName(part.name);
  if (part.type === 'strophe') {
    const m = /^(\s*)(vers|verse|strophe)\s*(\d+[a-z]?|[a-z])?$/i.exec(clean);
    if (m) {
      return m[3] ? `Strophe ${m[3]}` : `Strophe ${index + 1}`;
    }
    if (clean) return clean;
    return `Strophe ${index + 1}`;
  }
  if (part.type === 'refrain') {
    if (!clean) return 'Refrain';
    return clean.replace(/^chorus/i, 'Refrain');
  }
  if (clean) {
    return clean;
  }
  const fallback: Record<PartType, string> = {
    strophe: `Strophe ${index + 1}`,
    refrain: 'Refrain',
    bridge: 'Bridge',
    intro: 'Intro',
    schluss: 'Schluss',
    zwischenspiel: 'Zwischenspiel',
    weiterer: 'Teil ohne Namen',
  };
  return fallback[part.type];
}

/** Nächsten freien Strophennamen erzeugen („Vers 1“, „Vers 2“, …). */
export function nextStropheName(parts: Part[]): string {
  const numbers = parts
    .filter((p) => p.type === 'strophe')
    .map((p) => {
      const m = /(\d+)\s*$/.exec(p.name ?? '');
      return m ? Number(m[1]) : null;
    })
    .filter((n): n is number => n !== null);
  const max = numbers.length > 0 ? Math.max(...numbers) : 0;
  return `Vers ${max + 1}`;
}

/** Nächsten Refrain-Namen erzeugen („Refrain“, „Refrain 2“, …). */
export function nextRefrainName(parts: Part[]): string {
  const count = parts.filter((p) => p.type === 'refrain').length;
  return count === 0 ? 'Refrain' : `Refrain ${count + 1}`;
}

const BASE_NAMES: Record<Exclude<PartType, 'strophe' | 'refrain'>, string> = {
  bridge: 'Bridge',
  intro: 'Intro',
  schluss: 'Schluss',
  zwischenspiel: 'Zwischenspiel',
  weiterer: 'Teil',
};

/** Namen für ein neu hinzugefügtes Teil; doppelte Namen bekommen eine Nummer angehängt. */
export function nameForNewPart(
  type: PartType,
  parts: Part[],
  customName?: string,
): string {
  let base: string;
  if (type === 'strophe') base = nextStropheName(parts);
  else if (type === 'refrain') base = nextRefrainName(parts);
  else base = customName?.trim() || BASE_NAMES[type];

  const existing = new Set(parts.map((p) => (p.name ?? '').toLowerCase()));
  if (!existing.has(base.toLowerCase())) return base;
  let n = 2;
  while (existing.has(`${base} ${n}`.toLowerCase())) n += 1;
  return `${base} ${n}`;
}

/** Sinnbild (Emoji) je Teil-Art für die Karten. */
export function partIcon(type: PartType): string {
  switch (type) {
    case 'strophe':
      return '📖';
    case 'refrain':
      return '🔁';
    case 'bridge':
      return '🌉';
    case 'intro':
      return '🎬';
    case 'schluss':
      return '🏁';
    case 'zwischenspiel':
      return '🎵';
    default:
      return '⭐';
  }
}

/** Wahlmöglichkeiten im Menü „Weiteres Teil“. */
export const WEITERE_TEILE: { label: string; type: PartType }[] = [
  { label: 'Bridge', type: 'bridge' },
  { label: 'Pre-Refrain', type: 'weiterer' },
  { label: 'Pre-Bridge', type: 'weiterer' },
  { label: 'Intro', type: 'intro' },
  { label: 'Schluss', type: 'schluss' },
  { label: 'Zwischenspiel', type: 'zwischenspiel' },
  { label: 'Instrumental', type: 'zwischenspiel' },
  { label: 'Chor', type: 'weiterer' },
  { label: 'Gesprochener Text', type: 'weiterer' },
  { label: 'Antwort', type: 'weiterer' },
  { label: 'Solo', type: 'weiterer' },
  { label: 'Tag', type: 'weiterer' },
  { label: 'Coda', type: 'weiterer' },
  { label: 'Pre-Coda', type: 'weiterer' },
  { label: 'Übergang', type: 'weiterer' },
  { label: 'Eigenes Teil', type: 'weiterer' },
];
