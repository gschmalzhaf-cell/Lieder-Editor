import { useMemo, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cleanSectionName, partDisplayName, partIcon } from '../sng';
import type { Part } from '../sng';

interface Props {
  parts: Part[];
  verseOrder: string[];
  onChange: (nextOrder: string[]) => void;
  onSelectPart: (partId: string) => void;
}

interface ChipProps {
  id: string;
  label: string;
  matchedPart: Part | null;
  matchedIndex: number;
  onSelect: () => void;
  onRemove: () => void;
}

function OrderChip({ id, label, matchedPart, matchedIndex, onSelect, onRemove }: ChipProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const display = matchedPart ? partDisplayName(matchedPart, matchedIndex) : cleanSectionName(label);
  const typeClass = matchedPart ? `reihenfolge-chip--${matchedPart.type}` : 'reihenfolge-chip--fehlt';

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`reihenfolge-chip ${typeClass}${isDragging ? ' zieht' : ''}`}
    >
      <button
        type="button"
        className="reihenfolge-griff"
        aria-label={`${display} in der Abspielreihenfolge verschieben`}
        title="Ziehen zum Verschieben"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <button
        type="button"
        className="reihenfolge-label"
        onClick={onSelect}
        title={
          matchedPart
            ? `Vorschau für „${display}“ anzeigen`
            : `Teil „${display}“ ist in den Karten nicht vorhanden`
        }
      >
        {matchedPart && <span aria-hidden="true">{partIcon(matchedPart.type)}</span>}{' '}
        {display}
      </button>
      <button
        type="button"
        className="reihenfolge-entfernen"
        aria-label={`${display} aus der Abspielreihenfolge entfernen`}
        title="Aus Reihenfolge entfernen"
        onClick={onRemove}
      >
        ×
      </button>
    </div>
  );
}

export default function VerseOrderBar({ parts, verseOrder, onChange, onSelectPart }: Props) {
  const [expanded, setExpanded] = useState(verseOrder.length > 0);
  const isOpen = expanded || verseOrder.length > 0;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Zuordnung Name (kleingeschrieben) -> erster passender Teil
  const partLookup = useMemo(() => {
    const map = new Map<string, { part: Part; index: number }>();
    parts.forEach((part, index) => {
      if (!part.name) return;
      const rawKey = part.name.trim().toLowerCase();
      const cleanKey = cleanSectionName(part.name).trim().toLowerCase();
      if (!map.has(rawKey)) map.set(rawKey, { part, index });
      if (!map.has(cleanKey)) map.set(cleanKey, { part, index });
    });
    return map;
  }, [parts]);

  // Eindeutige benannte Teile als Schnell-Knöpfe zum Hinzufügen
  const uniqueNamedParts = useMemo(() => {
    const seen = new Set<string>();
    const list: { rawName: string; part: Part; index: number }[] = [];
    parts.forEach((part, index) => {
      if (!part.name || part.name.trim() === '') return;
      const clean = cleanSectionName(part.name).trim();
      const key = clean.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      list.push({ rawName: clean, part, index });
    });
    return list;
  }, [parts]);

  const itemIds = verseOrder.map((_, idx) => `vo-${idx}`);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = itemIds.indexOf(String(active.id));
    const to = itemIds.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    onChange(arrayMove(verseOrder, from, to));
  };

  const fillFromParts = () => {
    const allNames = parts
      .map((p) => (p.name ? cleanSectionName(p.name).trim() : ''))
      .filter((n) => n !== '');
    onChange(allNames);
  };

  if (!isOpen) {
    return (
      <section className="reihenfolge reihenfolge--kompakt" aria-label="Abspielreihenfolge">
        <button
          type="button"
          className="reihenfolge-oeffnen"
          onClick={() => setExpanded(true)}
        >
          🔀 Abspielreihenfolge festlegen (optional – z. B. Refrain mehrfach abspielen)
        </button>
      </section>
    );
  }

  return (
    <section className="reihenfolge" aria-label="Abspielreihenfolge">
      <div className="reihenfolge-kopf">
        <div>
          <h2>🔀 Abspielreihenfolge</h2>
          <p className="reihenfolge-text">
            Ziehe die Bausteine in die gewünschte Reihenfolge. So kannst du z. B. den Refrain
            mehrfach abspielen, ohne den Text doppelt zu schreiben.
          </p>
        </div>
        <div className="reihenfolge-aktionen">
          {uniqueNamedParts.length > 0 && (
            <button type="button" onClick={fillFromParts}>
              Alle Teile übernehmen
            </button>
          )}
          {verseOrder.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onChange([]);
                setExpanded(false);
              }}
            >
              Reihenfolge leeren
            </button>
          )}
          {verseOrder.length === 0 && (
            <button type="button" onClick={() => setExpanded(false)}>
              Ausblenden
            </button>
          )}
        </div>
      </div>

      {verseOrder.length > 0 ? (
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          sensors={sensors}
        >
          <SortableContext items={itemIds} strategy={rectSortingStrategy}>
            <div className="reihenfolge-liste" role="list" aria-label="Festgelegte Reihenfolge">
              {verseOrder.map((name, idx) => {
                const match = partLookup.get(name.trim().toLowerCase());
                return (
                  <OrderChip
                    key={itemIds[idx]}
                    id={itemIds[idx]}
                    label={name}
                    matchedPart={match?.part ?? null}
                    matchedIndex={match?.index ?? 0}
                    onSelect={() => {
                      if (match) onSelectPart(match.part.id);
                    }}
                    onRemove={() => {
                      const next = verseOrder.filter((_, i) => i !== idx);
                      onChange(next);
                    }}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <p className="reihenfolge-leer">
          Noch keine Reihenfolge festgelegt – klicke unten auf einen Teil, um ihn hinzuzufügen.
        </p>
      )}

      {uniqueNamedParts.length > 0 && (
        <div className="reihenfolge-palette" aria-label="Teil zur Reihenfolge hinzufügen">
          <span className="reihenfolge-palette-label">Hinzufügen:</span>
          {uniqueNamedParts.map(({ rawName, part, index }) => (
            <button
              key={rawName}
              type="button"
              className="reihenfolge-add-btn"
              onClick={() => onChange([...verseOrder, rawName])}
            >
              + {partDisplayName(part, index)}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
