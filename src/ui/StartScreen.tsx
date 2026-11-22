import { useState } from 'react';
import type { DragEvent } from 'react';

interface Props {
  onNewSong: () => void;
  onOpenFile: (file: File) => Promise<boolean>;
}

export default function StartScreen({ onNewSong, onOpenFile }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const pickFile = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const ok = await onOpenFile(file);
    if (!ok) {
      setError('Die Datei konnte nicht gelesen werden. Bitte wähle eine .sng-Datei aus.');
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files);
  };

  return (
    <main
      className={`start${dragOver ? ' drag-over' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <h1>Lieder-Editor</h1>
      <p className="erklaerung">
        Hier legst du Lieder für SongBeamer an und bearbeitest sie – direkt im Browser, am Laptop
        oder am Tablet. Du brauchst keine Technikkenntnisse und kein Konto. Alles bleibt auf
        deinem Gerät; es wird nichts ins Internet hochgeladen.
      </p>
      <div className="start-knoepfe">
        <button type="button" className="gross primaer" onClick={onNewSong}>
          Neues Lied
        </button>
        <label className="gross datei-knopf">
          Datei öffnen
          <input
            type="file"
            accept=".sng,.SNG,text/plain"
            className="versteckt"
            onChange={(e) => {
              pickFile(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
      </div>
      <p className="tipp">Tipp: Eine .sng-Datei kannst du auch direkt auf diese Seite ziehen.</p>
      {error && (
        <div className="pruefung" role="alert">
          {error}
        </div>
      )}
    </main>
  );
}
