import { Fragment, useState } from 'react';
import { buildPreviewLines, partDisplayName } from '../sng';
import type { Part, PreviewSpan } from '../sng';

interface Props {
  parts: Part[];
  index: number;
  langCount?: number;
  bilingual?: boolean;
  onNavigate: (delta: number) => void;
}

type LangFilter = 'all' | '1' | '2';

function renderSpan(span: PreviewSpan, key: number) {
  let node: React.ReactNode = span.text;
  if (span.underline) node = <u>{node}</u>;
  if (span.italic) node = <em>{node}</em>;
  if (span.bold) node = <strong>{node}</strong>;
  return <Fragment key={key}>{node}</Fragment>;
}

export default function Preview({
  parts,
  index,
  langCount = 1,
  bilingual = false,
  onNavigate,
}: Props) {
  const [langFilter, setLangFilter] = useState<LangFilter>('all');
  const part = parts.length > 0 ? parts[Math.min(index, parts.length - 1)] : null;
  const safeIndex = parts.length > 0 ? Math.min(index, parts.length - 1) : 0;
  const allPreviewLines = part ? buildPreviewLines(part.lines, langCount) : [];
  const previewLines =
    bilingual && langFilter !== 'all'
      ? allPreviewLines.filter(
          (l) => l.kind !== 'text' || l.subtitle || l.lang === Number(langFilter),
        )
      : allPreviewLines;
  const textLineCount = previewLines.filter((l) => l.kind === 'text').length;

  const sizeClass =
    previewLines.length > 10
      ? ' folie--sehr-kompakt'
      : previewLines.length > 6
        ? ' folie--kompakt'
        : '';

  return (
    <aside className="vorschau" aria-label="Vorschau der Folie">
      <div className="vorschau-kopf">
        <h2 className="vorschau-titel">Vorschau</h2>
        {bilingual && (
          <div className="vorschau-sprachen" role="group" aria-label="Sprachen in der Vorschau">
            <button
              type="button"
              className={langFilter === 'all' ? 'aktiv' : ''}
              onClick={() => setLangFilter('all')}
            >
              Beide
            </button>
            <button
              type="button"
              className={langFilter === '1' ? 'aktiv' : ''}
              onClick={() => setLangFilter('1')}
            >
              1
            </button>
            <button
              type="button"
              className={langFilter === '2' ? 'aktiv' : ''}
              onClick={() => setLangFilter('2')}
            >
              2
            </button>
          </div>
        )}
      </div>
      <div className={`folie${sizeClass}`} aria-live="polite">
        {part ? (
          previewLines.length > 0 ? (
            previewLines.map((line, i) => {
              if (line.kind === 'blank') {
                return (
                  <p key={i} className="leer" aria-hidden="true">
                    {'\u00A0'}
                  </p>
                );
              }
              if (line.kind === 'break') {
                return <hr key={i} className="folie-umbruch" aria-label="Folienumbruch" />;
              }
              const classes = [
                line.subtitle ? 'folie-untertitel' : '',
                line.lang >= 2 ? 'folie-sprache-2' : '',
              ]
                .filter(Boolean)
                .join(' ');
              return (
                <p key={i} className={classes || undefined}>
                  {line.spans.map((span, sIdx) => renderSpan(span, sIdx))}
                </p>
              );
            })
          ) : (
            <p className="folie-platzhalter">Schreibe links Text in diese Karte …</p>
          )
        ) : (
          <p className="folie-platzhalter">Noch keine Teile vorhanden.</p>
        )}
      </div>
      {textLineCount > 8 && (
        <p className="vorschau-tipp">
          Tipp: Auf dieser Folie stehen {textLineCount} Zeilen. Für die Gemeinde sind 4 bis 6 Zeilen
          am besten lesbar.
        </p>
      )}
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
