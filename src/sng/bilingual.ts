import type { Part, Song } from './types';

export type BilingualStyle = 'alternating' | 'prefixed';

export interface SplitLanguages {
  lang1: string[];
  lang2: string[];
  style: BilingualStyle;
}

const LANG1_PREFIX = /^(##1 |#1 )/i;
const LANG2_PREFIX = /^(##2 |#2 )/i;

/** Prüft, ob eine Zeile explizit Sprache 2 markiert (`##2 ` oder `#2 `). */
export function hasExplicitLang2(lines: string[]): boolean {
  return lines.some((line) => LANG2_PREFIX.test(line));
}

/** Prüft, ob ein Lied zweisprachig ist (über #LangCount >= 2 oder ##2/#2-Zeilen). */
export function isSongBilingual(song: Song): boolean {
  if (song.langCount >= 2) return true;
  return song.parts.some((part) => hasExplicitLang2(part.lines));
}

/**
 * Zerlegt die Textzeilen einer Karte in Sprache 1 und Sprache 2,
 * ohne dass der Benutzer jemals `##2 ` oder `#1 ` sehen oder tippen muss.
 */
export function splitPartLanguages(part: Part, langCount: number): SplitLanguages {
  const lines = part.lines;
  const usesPrefixed = hasExplicitLang2(lines);

  if (usesPrefixed) {
    const lang1: string[] = [];
    const lang2: string[] = [];
    let pendingBlank = false;

    for (const raw of lines) {
      if (raw.trim() === '') {
        if (lang1.length > 0 || lang2.length > 0) pendingBlank = true;
        continue;
      }
      if (pendingBlank) {
        // Gleiche Zeilenanzahl vor dem Absatzabstand herstellen
        while (lang1.length < lang2.length) lang1.push('');
        while (lang2.length < lang1.length) lang2.push('');
        lang1.push('');
        lang2.push('');
        pendingBlank = false;
      }
      if (LANG2_PREFIX.test(raw)) {
        lang2.push(raw.replace(LANG2_PREFIX, ''));
      } else if (LANG1_PREFIX.test(raw)) {
        lang1.push(raw.replace(LANG1_PREFIX, ''));
      } else {
        lang1.push(raw);
      }
    }
    return { lang1, lang2, style: 'prefixed' };
  }

  if (langCount >= 2) {
    const lang1: string[] = [];
    const lang2: string[] = [];
    let nextLang: 1 | 2 = 1;

    for (const raw of lines) {
      const trimmed = raw.trim();
      if (trimmed === '') {
        while (lang1.length < lang2.length) lang1.push('');
        while (lang2.length < lang1.length) lang2.push('');
        lang1.push('');
        lang2.push('');
        nextLang = 1;
        continue;
      }
      if (/^#H /i.test(raw) || trimmed === '--' || trimmed === '--A' || trimmed === '--a') {
        lang1.push(raw);
        continue;
      }
      if (LANG1_PREFIX.test(raw)) {
        lang1.push(raw.replace(LANG1_PREFIX, ''));
        nextLang = 2;
      } else if (nextLang === 1) {
        lang1.push(raw);
        nextLang = 2;
      } else {
        lang2.push(raw);
        nextLang = 1;
      }
    }
    return { lang1, lang2, style: 'alternating' };
  }

  return { lang1: [...lines], lang2: [], style: 'alternating' };
}

/**
 * Führt Sprache 1 und Sprache 2 wieder sauber ins SongBeamer-Zeilenformat zusammen.
 * - `alternating`: Standard bei `#LangCount=2` (Zeile 1, Zeile 2 im Wechsel;
 *   bei ungleicher Zeilenanzahl wird `##1 ` / `##2 ` gesetzt, damit nichts verrutscht).
 * - `prefixed`: ChurchTools-Stil mit `##2 ` vor jeder Zeile der 2. Sprache.
 */
export function mergePartLanguages(
  lang1: string[],
  lang2: string[],
  style: BilingualStyle = 'alternating',
): string[] {
  const len = Math.max(lang1.length, lang2.length);
  const out: string[] = [];

  for (let i = 0; i < len; i += 1) {
    const l1 = lang1[i] ?? '';
    const l2 = lang2[i] ?? '';
    const empty1 = l1.trim() === '';
    const empty2 = l2.trim() === '';

    if (empty1 && empty2) {
      out.push('');
      continue;
    }

    if (style === 'prefixed') {
      if (!empty1) out.push(l1);
      if (!empty2) out.push(`##2 ${l2}`);
    } else {
      if (!empty1 && !empty2) {
        out.push(l1);
        out.push(l2);
      } else if (!empty1) {
        out.push(`##1 ${l1}`);
      } else {
        out.push(`##2 ${l2}`);
      }
    }
  }

  return out;
}
