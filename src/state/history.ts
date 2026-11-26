import { useCallback, useRef, useState } from 'react';
import type { Song } from '../sng/types';

const MAX = 200;
const MERGE_WINDOW_MS = 650;

export interface SongHistory {
  song: Song;
  /** Nimmt eine neue Version auf. Gleicher mergeKey kurz hintereinander fasst Tippen zusammen. */
  commit: (next: Song, mergeKey?: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  /** Setzt einen neuen Stand ohne Verlauf (z. B. nach dem Öffnen einer Datei). */
  reset: (song: Song) => void;
}

export function useSongHistory(initial: Song): SongHistory {
  const [song, setSong] = useState<Song>(initial);
  const songRef = useRef(song);
  songRef.current = song;
  const pastRef = useRef<Song[]>([]);
  const futureRef = useRef<Song[]>([]);
  const lastMergeRef = useRef<{ key: string; at: number } | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const commit = useCallback((next: Song, mergeKey?: string) => {
    const now = Date.now();
    const shouldMerge =
      Boolean(mergeKey) &&
      lastMergeRef.current !== null &&
      lastMergeRef.current.key === mergeKey &&
      now - lastMergeRef.current.at < MERGE_WINDOW_MS &&
      pastRef.current.length > 0;

    if (!shouldMerge) {
      pastRef.current.push(structuredClone(songRef.current));
      if (pastRef.current.length > MAX) pastRef.current.shift();
    }
    lastMergeRef.current = mergeKey ? { key: mergeKey, at: now } : null;
    futureRef.current = [];
    setSong(next);
    setCanUndo(true);
    setCanRedo(false);
  }, []);

  const undo = useCallback(() => {
    const past = pastRef.current;
    if (past.length === 0) return;
    lastMergeRef.current = null;
    futureRef.current.push(structuredClone(songRef.current));
    const prev = past.pop() as Song;
    setSong(prev);
    setCanUndo(past.length > 0);
    setCanRedo(true);
  }, []);

  const redo = useCallback(() => {
    const future = futureRef.current;
    if (future.length === 0) return;
    lastMergeRef.current = null;
    pastRef.current.push(structuredClone(songRef.current));
    const next = future.pop() as Song;
    setSong(next);
    setCanUndo(true);
    setCanRedo(future.length > 0);
  }, []);

  const reset = useCallback((next: Song) => {
    pastRef.current = [];
    futureRef.current = [];
    lastMergeRef.current = null;
    setSong(next);
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  return { song, commit, undo, redo, canUndo, canRedo, reset };
}
