import type { Part, PartType } from './types';

export interface SectionNameInfo {
  type: PartType;
  number: number | null;
}

/**
 * Erkennt reservierte Abschnittsnamen von SongBeamer (deutsch und englisch),
 * jeweils mit optionaler Nummer oder Buchstabe („Vers 1“, „Teil A“).
 * `$$M=...` erzwingt einen eigenen Namen. Alles andere ist kein Name.
 */
const FIXED_NAMES: Record<string, PartType> = {
  bridge: 'bridge',
  brücke: 'bridge',
  intro: 'intro',
  outro: 'schluss',
  schluss: 'schluss',
  ending: 'schluss',
  zwischenspiel: 'zwischenspiel',
  interlude: 'zwischenspiel',
  'pre-chorus': 'weiterer',
  'pre chorus': 'weiterer',
  'pre-refrain': 'weiterer',
  'pre refrain': 'weiterer',
  teil: 'weiterer',
  part: 'weiterer',
  unbekannt: 'weiterer',
  unknown: 'weiterer',
  misc: 'weiterer',
  coda: 'weiterer',
  tag: 'weiterer',
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

export function parseSectionName(raw: string): SectionNameInfo | null {
  const line = normalize(raw);
  if (line === '') return null;
  if (line.startsWith('$$m=')) return { type: 'weiterer', number: null };

  let m = /^(vers|verse|strophe)\s*(\d+|[a-z])?$/.exec(line);
  if (m) {
    return { type: 'strophe', number: m[2] && /^\d+$/.test(m[2]) ? Number(m[2]) : null };
  }
  m = /^(refrain|chorus)\s*(\d+|[a-z])?$/.exec(line);
  if (m) {
    return { type: 'refrain', number: m[2] && /^\d+$/.test(m[2]) ? Number(m[2]) : null };
  }

  const words = line.split(' ');
  const last = words[words.length - 1];
  const isSuffix = /^\d+$/.test(last) || /^[a-z]$/.test(last);
  const base = isSuffix && words.length > 1 ? words.slice(0, -1).join(' ') : line;
  const type = FIXED_NAMES[base];
  if (type) return { type, number: null };
  return null;
}

/** Anzeigename einer Karte in Klartext, z. B. „Strophe 2“ oder „Refrain“. */
export function partDisplayName(part: Part, index: number): string {
  if (part.type === 'strophe') {
    const m = /(\d+)\s*$/.exec(part.name ?? '');
    return `Strophe ${m ? m[1] : index + 1}`;
  }
  if (part.type === 'refrain') {
    if (!part.name) return 'Refrain';
    return part.name.replace(/^chorus/i, 'Refrain');
  }
  if (part.name) {
    return part.name.replace(/^\$\$M=/i, '');
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
  { label: 'Intro', type: 'intro' },
  { label: 'Schluss', type: 'schluss' },
  { label: 'Zwischenspiel', type: 'zwischenspiel' },
  { label: 'Gesprochener Text', type: 'weiterer' },
  { label: 'Antwort', type: 'weiterer' },
  { label: 'Solo', type: 'weiterer' },
  { label: 'Pre-Refrain', type: 'weiterer' },
  { label: 'Tag', type: 'weiterer' },
  { label: 'Coda', type: 'weiterer' },
  { label: 'Übergang', type: 'weiterer' },
  { label: 'Eigenes Teil', type: 'weiterer' },
];
