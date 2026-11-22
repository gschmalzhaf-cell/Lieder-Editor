import { partDisplayName } from '../sng';
import type { Part } from '../sng';

interface Props {
  parts: Part[];
  index: number;
  onNavigate: (delta: number) => void;
}

export default function Preview({ parts, index, onNavigate }: Props) {
  const part = parts.length > 0 ? parts[Math.min(index, parts.length - 1)] : null;
  const safeIndex = parts.length > 0 ? Math.min(index, parts.length - 1) : 0;
  return (
    <aside className="vorschau" aria-label="Vorschau der Folie">
      <h2 className="vorschau-titel">Vorschau</h2>
      <div className="folie" aria-live="polite">
        {part ? (
          part.lines.map((line, i) => (
            <p key={i} className={line.trim() === '' ? 'leer' : ''}>
              {line.trim() === '' ? ' ' : line}
            </p>
          ))
        ) : (
          <p className="leer">Noch keine Teile vorhanden.</p>
        )}
      </div>
      <div className="folien-nav">
        <button
          type="button"
          onClick={() => onNavigate(-1)}
          disabled={parts.length === 0 || safeIndex <= 0}
        >
          ← Zurück
        </button>
        <span className="folien-stand">
          {parts.length === 0
            ? 'Keine Teile'
            : `Teil ${safeIndex + 1} von ${parts.length} · ${partDisplayName(part as Part, safeIndex)}`}
        </span>
        <button
          type="button"
          onClick={() => onNavigate(1)}
          disabled={parts.length === 0 || safeIndex >= parts.length - 1}
        >
          Weiter →
        </button>
      </div>
    </aside>
  );
}
