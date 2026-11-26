import { useEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cleanSectionName, partDisplayName, partIcon } from '../sng';
import type { Part } from '../sng';

interface Props {
  part: Part;
  index: number;
  count: number;
  selected: boolean;
  focusTarget?: 'text' | 'name' | null;
  onFocusHandled?: () => void;
  onSelect: () => void;
  onLines: (text: string) => void;
  onRename: (name: string) => void;
  onMove: (delta: number) => void;
  onRepeat: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export default function PartCard(props: Props) {
  const { part, index, count, selected, focusTarget, onFocusHandled } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: part.id });
  const [renaming, setRenaming] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draftName, setDraftName] = useState(() => cleanSectionName(part.name));
  const deleteTimer = useRef<number | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (renaming) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [renaming]);

  useEffect(() => {
    if (!focusTarget) return;
    if (focusTarget === 'name') {
      setDraftName(cleanSectionName(part.name));
      setRenaming(true);
    } else if (focusTarget === 'text') {
      textAreaRef.current?.focus();
      textAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    onFocusHandled?.();
  }, [focusTarget, onFocusHandled, part.name]);

  useEffect(
    () => () => {
      if (deleteTimer.current !== null) window.clearTimeout(deleteTimer.current);
    },
    [],
  );

  const displayName = partDisplayName(part, index);

  const askDelete = () => {
    if (confirmDelete) {
      props.onDelete();
      return;
    }
    setConfirmDelete(true);
    if (deleteTimer.current !== null) window.clearTimeout(deleteTimer.current);
    deleteTimer.current = window.setTimeout(() => setConfirmDelete(false), 4000);
  };

  const commitName = () => {
    setRenaming(false);
    const name = draftName.trim();
    props.onRename(name === '' ? '' : name);
  };

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`karte karte--${part.type}${selected ? ' ausgewaehlt' : ''}${isDragging ? ' zieht' : ''}`}
      onClick={props.onSelect}
    >
      <header className="karten-kopf">
        <button
          type="button"
          ref={setActivatorNodeRef}
          className="griff"
          aria-label={`${displayName} verschieben – am Laptop ziehen, am Tablet lange drücken`}
          title="Verschieben (ziehen oder lange drücken)"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>
        <span className="symbol" aria-hidden="true">
          {partIcon(part.type)}
        </span>
        {renaming ? (
          <input
            ref={nameInputRef}
            className="karten-name-input"
            value={draftName}
            aria-label={`Name von ${displayName}`}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitName();
              if (e.key === 'Escape') {
                setDraftName(cleanSectionName(part.name));
                setRenaming(false);
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <button
            type="button"
            className="karten-name"
            onClick={(e) => {
              e.stopPropagation();
              setDraftName(cleanSectionName(part.name));
              setRenaming(true);
              props.onSelect();
            }}
            title="Teil umbenennen"
          >
            {displayName} <span aria-hidden="true">✏️</span>
          </button>
        )}
        {part.origin === 'wiederholung' && <span className="abzeichen">Wiederholung</span>}
      </header>
      <textarea
        ref={textAreaRef}
        className="karten-text"
        value={part.lines.join('\n')}
        rows={Math.max(3, part.lines.length)}
        placeholder={'Text hier eingeben …\n\nEine leere Zeile macht Abstand auf der Folie.'}
        aria-label={`Text von ${displayName}`}
        onChange={(e) => props.onLines(e.target.value)}
        onFocus={props.onSelect}
      />
      <div className="karten-aktionen">
        <button type="button" onClick={() => props.onMove(-1)} disabled={index === 0}>
          ↑ Nach oben
        </button>
        <button type="button" onClick={() => props.onMove(1)} disabled={index === count - 1}>
          ↓ Nach unten
        </button>
        <button type="button" onClick={props.onRepeat}>
          Teil wiederholen
        </button>
        <button type="button" onClick={props.onCopy}>
          Text übernehmen
        </button>
        <button
          type="button"
          className={confirmDelete ? 'loeschen-bestaetigt' : ''}
          onClick={askDelete}
        >
          {confirmDelete ? 'Wirklich löschen?' : 'Löschen'}
        </button>
      </div>
    </article>
  );
}
