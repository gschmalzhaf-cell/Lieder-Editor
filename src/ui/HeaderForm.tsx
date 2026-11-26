import type { RefObject } from 'react';
import type { HeaderFields } from '../sng';

interface Props {
  header: HeaderFields;
  onChange: (field: keyof HeaderFields, value: string) => void;
  titleInputRef?: RefObject<HTMLInputElement | null>;
}

const OPTIONAL_FIELDS: { key: keyof HeaderFields; label: string; placeholder: string }[] = [
  { key: 'author', label: 'Autor', placeholder: 'Wer hat den Text geschrieben?' },
  { key: 'melody', label: 'Melodie', placeholder: 'Wer hat die Melodie geschrieben?' },
  { key: 'songNumber', label: 'Liednummer', placeholder: 'z. B. EG 331 oder Liednummer' },
  { key: 'copyright', label: 'Copyright', placeholder: 'z. B. Verlag oder „Public Domain“' },
  { key: 'notes', label: 'Notizen', placeholder: 'Interne Bemerkungen zum Lied' },
];

export default function HeaderForm({ header, onChange, titleInputRef }: Props) {
  return (
    <section className="kopfdaten" aria-label="Kopfdaten des Liedes">
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
      <div className="kopfdaten-grid">
        {OPTIONAL_FIELDS.map((f) => (
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
    </section>
  );
}
