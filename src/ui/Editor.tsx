import { useCallback, useEffect, useRef, useState } from 'react';
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
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { SongHistory } from '../state/history';
import { clearStand } from '../state/storage';
import {
  WEITERE_TEILE,
  cleanSectionName,
  encodeSong,
  getHeaderValue,
  nameForNewPart,
  nextPartId,
  sngFilename,
  validateSongDetailed,
} from '../sng';
import type { HeaderFields, Part, PartType, Song, ValidationIssue } from '../sng';
import HeaderForm from './HeaderForm';
import PartCard from './PartCard';
import Preview from './Preview';

interface Props {
  history: SongHistory;
  onExit: () => void;
}

export default function Editor({ history, onExit }: Props) {
  const { song, commit, undo, redo, canUndo, canRedo } = history;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ id: string; target: 'text' | 'name' } | null>(
    null,
  );
  const [saveIssues, setSaveIssues] = useState<ValidationIssue[]>([]);
  const [savedName, setSavedName] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const pruefRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const addBarRef = useRef<HTMLDivElement>(null);
  const noticeTimer = useRef<number | null>(null);

  // Ziehen mit der Maus, langes Drücken am Tablet und Verschieben per Tastatur
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const selectedIndex = Math.max(
    0,
    song.parts.findIndex((p) => p.id === selectedId),
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  useEffect(
    () => () => {
      if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    },
    [],
  );

  const update = (next: Song, mergeKey?: string) => {
    setSaveIssues([]);
    setSavedName(null);
    commit(next, mergeKey);
  };

  const showNotice = (text: string) => {
    setNotice(text);
    if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 4000);
  };

  const clearFocusRequest = useCallback(() => {
    setFocusRequest(null);
  }, []);

  const langCount = Number(getHeaderValue(song, 'langcount') ?? '1');

  const addPart = (type: PartType, customName?: string, askNameImmediately = false) => {
    const part: Part = {
      id: nextPartId(),
      type,
      name: nameForNewPart(type, song.parts, customName),
      lines: [''],
      origin: 'neu',
    };
    update({ ...song, parts: [...song.parts, part] });
    setSelectedId(part.id);
    setFocusRequest({ id: part.id, target: askNameImmediately ? 'name' : 'text' });
  };

  const updatePart = (id: string, patch: Partial<Part>, mergeKey?: string) => {
    update(
      {
        ...song,
        parts: song.parts.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      },
      mergeKey,
    );
  };

  const renamePart = (part: Part, nextName: string) => {
    const trimmed = nextName.trim();
    const currentClean = cleanSectionName(part.name).trim();
    if (trimmed === currentClean) return;
    updatePart(part.id, {
      name: trimmed === '' ? null : trimmed,
      origin: part.origin === 'datei' ? 'neu' : part.origin,
    });
  };

  const movePart = (id: string, delta: number) => {
    const from = song.parts.findIndex((p) => p.id === id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= song.parts.length) return;
    update({ ...song, parts: arrayMove(song.parts, from, to) });
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = song.parts.findIndex((p) => p.id === active.id);
    const to = song.parts.findIndex((p) => p.id === over.id);
    if (from < 0 || to < 0) return;
    update({ ...song, parts: arrayMove(song.parts, from, to) });
  };

  const repeatPart = (id: string) => {
    const from = song.parts.findIndex((p) => p.id === id);
    if (from < 0) return;
    const src = song.parts[from];
    const copy: Part = {
      id: nextPartId(),
      type: src.type,
      name: src.name,
      lines: [...src.lines],
      origin: 'wiederholung',
    };
    const parts = [...song.parts];
    parts.splice(from + 1, 0, copy);
    update({ ...song, parts });
    setSelectedId(copy.id);
  };

  const deletePart = (id: string) => {
    update({ ...song, parts: song.parts.filter((p) => p.id !== id) });
    if (selectedId === id) setSelectedId(null);
  };

  const copyText = async (part: Part) => {
    const text = part.lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      showNotice(
        'Der Text wurde in die Zwischenablage übernommen. Du kannst ihn in einem anderen Teil einfügen.',
      );
    } catch {
      showNotice(
        'Kopieren ist hier nicht erlaubt. Bitte markiere den Text im Feld und kopiere ihn selbst.',
      );
    }
  };

  const updateHeader = (field: keyof HeaderFields, value: string) => {
    update(
      {
        ...song,
        header: { ...song.header, [field]: value },
        headerDirty: true,
      },
      `header:${field}`,
    );
  };

  const jumpToIssue = (issue: ValidationIssue) => {
    if (issue.target === 'title') {
      titleInputRef.current?.focus();
      titleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (issue.target === 'part' && issue.partId) {
      setSelectedId(issue.partId);
      setFocusRequest({ id: issue.partId, target: 'text' });
    } else if (issue.target === 'parts') {
      addBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const save = () => {
    const issues = validateSongDetailed(song);
    if (issues.length > 0) {
      setSaveIssues(issues);
      setSavedName(null);
      pruefRef.current?.focus();
      return;
    }
    const bytes = new Uint8Array(encodeSong(song));
    const blob = new Blob([bytes], { type: 'text/plain;charset=utf-8' });
    const name = sngFilename(song.header.title);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    clearStand();
    setSaveIssues([]);
    setSavedName(name);
  };

  const navigate = (delta: number) => {
    if (song.parts.length === 0) return;
    const next = Math.min(Math.max(selectedIndex + delta, 0), song.parts.length - 1);
    setSelectedId(song.parts[next].id);
  };

  return (
    <div className="editor">
      <header className="kopf-leiste">
        <div className="kopf-links">
          <h1 className="app-name">🎵 Lieder-Editor</h1>
          <span className="gesichert-hinweis" aria-live="polite">
            ✓ Im Browser gesichert
          </span>
        </div>
        <div className="kopf-aktionen">
          <button type="button" onClick={undo} disabled={!canUndo} title="Rückgängig (Strg + Z)">
            ↩ Rückgängig
          </button>
          <button type="button" onClick={redo} disabled={!canRedo} title="Wiederholen (Strg + Y)">
            ↪ Wiederholen
          </button>
          <button type="button" className="primaer" onClick={save}>
            Als Datei speichern
          </button>
          <button type="button" onClick={onExit}>
            Zur Startseite
          </button>
        </div>
      </header>

      {langCount > 1 && (
        <div className="hinweis" role="status">
          Diese Datei enthält mehrere Sprachen. Sie wird so angezeigt und wieder ausgegeben, wie
          sie ist.
        </div>
      )}
      {notice && (
        <div className="hinweis" role="status">
          {notice}
        </div>
      )}
      {saveIssues.length > 0 && (
        <div className="pruefung" role="alert" tabIndex={-1} ref={pruefRef}>
          <h2>Bevor du speichern kannst, ist noch etwas offen:</h2>
          <ul>
            {saveIssues.map((issue) => (
              <li key={issue.message}>
                <button
                  type="button"
                  className="pruefung-link"
                  onClick={() => jumpToIssue(issue)}
                >
                  {issue.message}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {savedName && (
        <div className="erfolg" role="status">
          Die Datei „{savedName}“ wurde gespeichert und heruntergeladen.
        </div>
      )}

      <HeaderForm header={song.header} onChange={updateHeader} titleInputRef={titleInputRef} />

      <main className="arbeitsflaeche">
        <section className="teile" aria-label="Liedteile">
          {song.parts.length === 0 && (
            <p className="leer-hinweis">
              Noch keine Teile. Füge unten eine Strophe oder einen Refrain hinzu – der Titel steht
              oben in den Kopfdaten.
            </p>
          )}

          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
            sensors={sensors}
          >
            <SortableContext
              items={song.parts.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              {song.parts.map((part, i) => (
                <PartCard
                  key={part.id}
                  part={part}
                  index={i}
                  count={song.parts.length}
                  selected={part.id === selectedId}
                  focusTarget={focusRequest?.id === part.id ? focusRequest.target : null}
                  onFocusHandled={clearFocusRequest}
                  onSelect={() => setSelectedId(part.id)}
                  onLines={(text) =>
                    updatePart(part.id, { lines: text.split('\n') }, `part:${part.id}`)
                  }
                  onRename={(name) => renamePart(part, name)}
                  onMove={(delta) => movePart(part.id, delta)}
                  onRepeat={() => repeatPart(part.id)}
                  onCopy={() => void copyText(part)}
                  onDelete={() => deletePart(part.id)}
                />
              ))}
            </SortableContext>
          </DndContext>

          <div className="hinzufuegen" ref={addBarRef}>
            <button type="button" className="gross primaer" onClick={() => addPart('strophe')}>
              + Strophe hinzufügen
            </button>
            <button type="button" className="gross primaer" onClick={() => addPart('refrain')}>
              + Refrain hinzufügen
            </button>
            <label className="gross weiteres">
              <span>Weiteres Teil ▾</span>
              <select
                value=""
                aria-label="Weiteres Teil auswählen"
                onChange={(e) => {
                  const label = e.target.value;
                  if (!label) return;
                  const entry = WEITERE_TEILE.find((t) => t.label === label);
                  if (entry) {
                    const isCustom = entry.label === 'Eigenes Teil';
                    addPart(entry.type, entry.label, isCustom);
                  }
                  e.target.value = '';
                }}
              >
                <option value="" disabled>
                  Menü öffnen …
                </option>
                {WEITERE_TEILE.map((t) => (
                  <option key={t.label} value={t.label}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <Preview
          parts={song.parts}
          index={selectedIndex}
          langCount={langCount}
          onNavigate={navigate}
        />
      </main>
    </div>
  );
}
