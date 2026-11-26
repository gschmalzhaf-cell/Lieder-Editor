import type { Song } from '../sng/types';

const KEY = 'lieder-editor:stand';

/** Automatisch abspeichern (bei jedem Tastendruck über das Editor-Menü aufgerufen). */
export function saveStand(song: Song): void {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ version: 1, savedAt: new Date().toISOString(), song }),
    );
  } catch {
    // Speicher voll oder nicht verfügbar – dann einfach nicht zwischenspeichern.
  }
}

export function loadStand(): Song | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { song?: Song };
    const song = data?.song;
    if (!song || typeof song !== 'object' || !song.header || !Array.isArray(song.parts)) {
      return null;
    }
    return song;
  } catch {
    return null;
  }
}

export function clearStand(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignorieren
  }
}
