import { useEffect, useState } from 'react';
import { createEmptySong, parseSongBytes } from './sng';
import type { Song } from './sng';
import { useSongHistory } from './state/history';
import { clearStand, loadStandWithMeta, saveStand } from './state/storage';
import type { StoredStand } from './state/storage';
import StartScreen from './ui/StartScreen';
import RestoreScreen from './ui/RestoreScreen';
import Editor from './ui/Editor';

type Screen = 'restore' | 'start' | 'editor';

export default function App() {
  const [stored] = useState<StoredStand | null>(() => loadStandWithMeta());
  const [screen, setScreen] = useState<Screen>(stored ? 'restore' : 'start');
  const history = useSongHistory(stored?.song ?? createEmptySong());

  // Automatisches Abspeichern im Browser bei jeder Änderung (jeder Tastendruck)
  useEffect(() => {
    if (screen === 'editor') saveStand(history.song);
  }, [history.song, screen]);

  const openNewSong = () => {
    history.reset(createEmptySong());
    setScreen('editor');
  };

  const openSong = (song: Song) => {
    history.reset(song);
    setScreen('editor');
  };

  const readFile = async (file: File): Promise<boolean> => {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { song } = parseSongBytes(bytes);
      openSong(song);
      return true;
    } catch {
      return false;
    }
  };

  if (screen === 'restore' && stored) {
    return (
      <RestoreScreen
        title={stored.song.header.title}
        partCount={stored.song.parts.length}
        onContinue={() => setScreen('editor')}
        onNewStart={() => {
          clearStand();
          history.reset(createEmptySong());
          setScreen('start');
        }}
      />
    );
  }

  if (screen === 'start') {
    return <StartScreen onNewSong={openNewSong} onOpenFile={readFile} />;
  }

  return <Editor history={history} onExit={() => setScreen('start')} />;
}
