import { partDisplayName } from './names';
import type { Part, PartType, Song } from './types';

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
 * Prüfung vor dem Speichern. Liefert Meldungen in schlichter Sprache,
 * ohne Fachbegriffe.
 */
export function validateSong(song: Song): string[] {
  const messages: string[] = [];
  if (song.header.title.trim() === '') {
    messages.push('Bitte gib dem Lied noch einen Titel.');
  }
  if (song.parts.length === 0) {
    messages.push('Das Lied hat noch keine Teile. Füge eine Strophe hinzu.');
    return messages;
  }
  song.parts.forEach((part: Part, index: number) => {
    const label =
      part.type === 'weiterer' && part.name
        ? `Teil „${part.name.replace(/^\$\$M=/i, '')}“`
        : partDisplayName(part, index);
    const g = GRAMMAR[part.type];
    const hasText = part.lines.some((line) => line.trim() !== '');
    if (hasText) return;
    if (part.lines.length === 0) {
      messages.push(`${g.def} ${label} ist noch leer. Fülle ${g.pron} oder lösch ${g.pron}.`);
    } else {
      messages.push(`${g.prep} ${label} stehen nur leere Zeilen.`);
    }
  });
  return messages;
}
