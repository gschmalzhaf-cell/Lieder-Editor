import { emptyHeader } from '../sng/types';
import type { Song } from '../sng/types';

const KEY = 'lieder-editor:stand';

/** Automatisch abspeichern (bei jedem Tastendruck über das Editor-Menü aufgerufen). */
export function saveStand(song: Song): void {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ version: 2, savedAt: new Date().toISOString(), song }),
    );
  } catch {
    // Speicher voll oder nicht verfügbar – dann einfach nicht zwischenspeichern.
  }
}

export interface StoredStand {
  song: Song;
  savedAt: string | null;
}

export function loadStandWithMeta(): StoredStand | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { song?: Song; savedAt?: string };
    const song = data?.song;
    if (!song || typeof song !== 'object' || !song.header || !Array.isArray(song.parts)) {
      return null;
    }
    const normalized: Song = {
      ...song,
      header: { ...emptyHeader(), ...song.header },
      langCount: typeof song.langCount === 'number' && song.langCount >= 1 ? song.langCount : 1,
      verseOrder: Array.isArray(song.verseOrder) ? song.verseOrder : [],
    };
    return {
      song: normalized,
      savedAt: typeof data.savedAt === 'string' ? data.savedAt : null,
    };
  } catch {
    return null;
  }
}

export function loadStand(): Song | null {
  return loadStandWithMeta()?.song ?? null;
}

export function clearStand(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignorieren
  }
}
