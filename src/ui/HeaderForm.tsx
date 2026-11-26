import { useState } from 'react';
import type { RefObject } from 'react';
import type { HeaderFields } from '../sng';

interface Props {
  header: HeaderFields;
  bilingual: boolean;
  onToggleBilingual: (enabled: boolean) => void;
  onChange: (field: keyof HeaderFields, value: string) => void;
  titleInputRef?: RefObject<HTMLInputElement | null>;
}

const BASIC_FIELDS: { key: keyof HeaderFields; label: string; placeholder: string }[] = [
  { key: 'author', label: 'Autor (Text)', placeholder: 'Wer hat den Text geschrieben?' },
  { key: 'melody', label: 'Melodie', placeholder: 'Wer hat die Melodie geschrieben?' },
  { key: 'songNumber', label: 'CCLI / Liednummer', placeholder: 'z. B. 4768151' },
  { key: 'copyright', label: 'Copyright', placeholder: 'z. B. Verlag oder „Public Domain“' },
  { key: 'notes', label: 'Notizen', placeholder: 'Interne Bemerkungen zum Lied' },
];

const EXTENDED_FIELDS: { key: keyof HeaderFields; label: string; placeholder: string }[] = [
  { key: 'key', label: 'Tonart', placeholder: 'z. B. G, Bbm, F#m' },
  { key: 'timeSignature', label: 'Taktart', placeholder: 'z. B. 4/4, 3/4, 6/8' },
  { key: 'tempo', label: 'Tempo (BPM)', placeholder: 'z. B. 84 oder 120' },
  { key: 'songbook', label: 'Liederbuch', placeholder: 'z. B. EG 331 oder Feiert Jesus 12' },
  { key: 'churchSongId', label: 'Gemeinde-Nr.', placeholder: 'Interne Liednummer der Gemeinde' },
  { key: 'originalTitle', label: 'Originaltitel', placeholder: 'Ursprünglicher Titel bei Übersetzungen' },
  { key: 'translation', label: 'Übersetzung', placeholder: 'Wer hat das Lied übersetzt?' },
  { key: 'rights', label: 'Rechte / Lizenz', placeholder: 'Rechteinhaber oder Lizenzvermerk' },
  { key: 'categories', label: 'Kategorien', placeholder: 'z. B. Lobpreis, Dank, Abendmahl' },
  { key: 'keywords', label: 'Suchbegriffe', placeholder: 'Stichwörter für die Suche' },
  { key: 'bible', label: 'Bibelstelle', placeholder: 'z. B. Psalm 23' },
];

export default function HeaderForm({
  header,
  bilingual,
  onToggleBilingual,
  onChange,
  titleInputRef,
}: Props) {
  const filledExtendedCount = EXTENDED_FIELDS.filter((f) => header[f.key].trim() !== '').length;
  const [showExtended, setShowExtended] = useState(filledExtendedCount > 0);

  return (
    <section className="kopfdaten" aria-label="Kopfdaten des Liedes">
      <div className="kopfdaten-oben">
        <label className="titel-feld">
          <span className="feld-name">
            Titel <span className="pflicht">Pflicht</span>
          </span>
          <input
            ref={titleInputRef}
            id="lied-titel"
            type="text"
            value={header.title}
            placeholder="z. B. Näher, mein Gott, zu Dir"
            aria-required="true"
            onChange={(e) => onChange('title', e.target.value)}
          />
        </label>

        <div className="sprachen-umschalter" role="group" aria-label="Anzahl der Sprachen">
          <button
            type="button"
            className={!bilingual ? 'aktiv' : ''}
            aria-pressed={!bilingual}
            onClick={() => onToggleBilingual(false)}
          >
            Einsprachig
          </button>
          <button
            type="button"
            className={bilingual ? 'aktiv' : ''}
            aria-pressed={bilingual}
            onClick={() => onToggleBilingual(true)}
          >
            Zweisprachig
          </button>
        </div>
      </div>

      {bilingual && (
        <label className="feld titel-lang2-feld">
          <span className="feld-name">Titel (2. Sprache, freiwillig)</span>
          <input
            id="lied-titleLang2"
            type="text"
            value={header.titleLang2}
            placeholder="z. B. By Gracious Powers"
            onChange={(e) => onChange('titleLang2', e.target.value)}
          />
        </label>
      )}

      <div className="kopfdaten-grid">
        {BASIC_FIELDS.map((f) => (
          <label key={f.key} className="feld">
            <span className="feld-name">{f.label}</span>
            <input
              id={`lied-${f.key}`}
              type="text"
              value={header[f.key]}
              placeholder={f.placeholder}
              onChange={(e) => onChange(f.key, e.target.value)}
            />
          </label>
        ))}
      </div>

      <div className="erweitert-bereich">
        <button
          type="button"
          className="erweitert-toggle"
          aria-expanded={showExtended}
          onClick={() => setShowExtended((prev) => !prev)}
        >
          {showExtended ? '▾' : '▸'} Weitere Angaben (Tonart, Taktart, Tempo, Liederbuch …)
          {filledExtendedCount > 0 && (
            <span className="erweitert-badge">{`${filledExtendedCount} ausgefüllt`}</span>
          )}
        </button>

        {showExtended && (
          <div className="kopfdaten-grid kopfdaten-grid--erweitert">
            {EXTENDED_FIELDS.map((f) => (
              <label key={f.key} className="feld">
                <span className="feld-name">{f.label}</span>
                <input
                  id={`lied-${f.key}`}
                  type="text"
                  value={header[f.key]}
                  placeholder={f.placeholder}
                  onChange={(e) => onChange(f.key, e.target.value)}
                />
              </label>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
