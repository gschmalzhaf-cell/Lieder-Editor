interface Props {
  title?: string;
  partCount?: number;
  onContinue: () => void;
  onNewStart: () => void;
}

export default function RestoreScreen({ title, partCount = 0, onContinue, onNewStart }: Props) {
  const cleanTitle = title?.trim();
  const teileText =
    partCount === 1 ? '1 Teil' : `${partCount} Teile`;

  return (
    <main className="start">
      <h1>Ungespeicherte Änderungen wiederherstellen?</h1>
      <p className="erklaerung">
        In diesem Browser liegt noch ein Stand aus einer früheren Sitzung. Möchtest du damit
        weiterarbeiten?
      </p>
      {(cleanTitle || partCount > 0) && (
        <div className="entwurf-info" aria-label="Gespeicherter Entwurf">
          <strong>{cleanTitle || 'Lied ohne Titel'}</strong>
          <span>{teileText}</span>
        </div>
      )}
      <div className="start-knoepfe">
        <button type="button" className="gross primaer" onClick={onContinue}>
          Weiter bearbeiten
        </button>
        <button type="button" className="gross" onClick={onNewStart}>
          Neu beginnen
        </button>
      </div>
    </main>
  );
}
