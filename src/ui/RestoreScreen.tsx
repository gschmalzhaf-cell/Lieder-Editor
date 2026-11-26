interface Props {
  onContinue: () => void;
  onNewStart: () => void;
}

export default function RestoreScreen({ onContinue, onNewStart }: Props) {
  return (
    <main className="start">
      <h1>Ungespeicherte Änderungen wiederherstellen?</h1>
      <p className="erklaerung">
        In diesem Browser liegt noch ein Stand aus einer früheren Sitzung. Möchtest du damit
        weiterarbeiten?
      </p>
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
