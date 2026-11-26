import { cleanSectionName, partDisplayName } from './names';
import type { Part, PartType, Song } from './types';

export interface ValidationIssue {
  message: string;
  target: 'title' | 'parts' | 'part';
  partId?: string;
}

// Grammatik je Teil-Art für die Klartext-Meldungen
const GRAMMAR: Record<PartType, { def: string; pron: string; prep: string }> = {
  strophe: { def: 'Die', pron: 'sie', prep: 'In der' },
  refrain: { def: 'Der', pron: 'ihn', prep: 'Im' },
  bridge: { def: 'Die', pron: 'sie', prep: 'In der' },
  intro: { def: 'Das', pron: 'es', prep: 'Im' },
  schluss: { def: 'Der', pron: 'ihn', prep: 'Im' },
  zwischenspiel: { def: 'Das', pron: 'es', prep: 'Im' },
  weiterer: { def: 'Das', pron: 'es', prep: 'Im' },
};

/**
 * Prüfung vor dem Speichern mit Zielangabe (für direktes Hinspringen in der Oberfläche).
 * Alle Meldungen sind in schlichter Sprache, ohne Fachbegriffe.
 */
export function validateSongDetailed(song: Song): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (song.header.title.trim() === '') {
    issues.push({
      message: 'Bitte gib dem Lied noch einen Titel.',
      target: 'title',
    });
  }
  if (song.parts.length === 0) {
    issues.push({
      message: 'Das Lied hat noch keine Teile. Füge eine Strophe hinzu.',
      target: 'parts',
    });
    return issues;
  }
  song.parts.forEach((part: Part, index: number) => {
    const clean = cleanSectionName(part.name);
    const label =
      part.type === 'weiterer' && clean ? `Teil „${clean}“` : partDisplayName(part, index);
    const g = GRAMMAR[part.type];
    const hasText = part.lines.some((line) => line.trim() !== '');
    if (hasText) return;
    const isTrulyEmpty =
      part.lines.length === 0 || (part.lines.length === 1 && part.lines[0] === '');
    if (isTrulyEmpty) {
      issues.push({
        message: `${g.def} ${label} ist noch leer. Fülle ${g.pron} oder lösch ${g.pron}.`,
        target: 'part',
        partId: part.id,
      });
    } else {
      issues.push({
        message: `${g.prep} ${label} stehen nur leere Zeilen.`,
        target: 'part',
        partId: part.id,
      });
    }
  });
  return issues;
}

/**
 * Prüfung vor dem Speichern. Liefert Meldungen in schlichter Sprache,
 * ohne Fachbegriffe.
 */
export function validateSong(song: Song): string[] {
  return validateSongDetailed(song).map((i) => i.message);
}
