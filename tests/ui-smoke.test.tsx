import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import App from '../src/App';
import RestoreScreen from '../src/ui/RestoreScreen';
import Preview from '../src/ui/Preview';
import Editor from '../src/ui/Editor';
import { createEmptySong } from '../src/sng';

describe('Oberfläche (Smoke-Tests)', () => {
  it('Startseite rendert ohne Fehler und zeigt beide großen Knöpfe', () => {
    const html = renderToString(createElement(App));
    expect(html).toContain('Neues Lied');
    expect(html).toContain('Datei öffnen');
    expect(html).toContain('Lieder-Editor');
  });

  it('Wiederherstellen-Ansicht zeigt gespeicherten Titel und Anzahl der Teile', () => {
    const html = renderToString(
      createElement(RestoreScreen, {
        title: 'Näher, mein Gott, zu Dir',
        partCount: 4,
        onContinue: () => {},
        onNewStart: () => {},
      }),
    );
    expect(html).toContain('Ungespeicherte Änderungen wiederherstellen?');
    expect(html).toContain('Näher, mein Gott, zu Dir');
    expect(html).toContain('4 Teile');
    expect(html).toContain('Weiter bearbeiten');
    expect(html).toContain('Neu beginnen');
  });

  it('Vorschau formatiert <b>/<i>, blendet #H aus und zeigt Lesbarkeitstipp ab 9 Zeilen', () => {
    const longLines = Array.from({ length: 9 }, (_, i) => `Zeile ${i + 1}`);
    const html = renderToString(
      createElement(Preview, {
        parts: [
          {
            id: 'p1',
            type: 'strophe',
            name: 'Vers 1',
            lines: ['#H Nur für Bediener', '<b>Lobe</b> den <i>Herrn</i>', ...longLines],
            origin: 'neu',
          },
        ],
        index: 0,
        onNavigate: () => {},
      }),
    );
    expect(html).toContain('<strong>Lobe</strong>');
    expect(html).toContain('<em>Herrn</em>');
    expect(html).not.toContain('Nur für Bediener');
    expect(html).toContain('4 bis 6 Zeilen am besten lesbar');
  });

  it('Editor rendert Kopfdaten, Karten, Hinzufügen-Knöpfe und Sicherungshinweis', () => {
    const song = createEmptySong();
    song.header.title = 'Mein Testlied';
    song.parts.push({
      id: 'p1',
      type: 'weiterer',
      name: '$$M=Solo Gitarre',
      lines: ['Erste Zeile'],
      origin: 'datei',
    });
    const html = renderToString(
      createElement(Editor, {
        history: {
          song,
          commit: () => {},
          undo: () => {},
          redo: () => {},
          canUndo: false,
          canRedo: false,
          reset: () => {},
        },
        onExit: () => {},
      }),
    );
    expect(html).toContain('Im Browser gesichert');
    expect(html).toContain('Solo Gitarre');
    // Leitprinzip: $$M= darf niemals sichtbar in der Oberfläche auftauchen
    expect(html).not.toContain('$$M=');
    expect(html).toContain('Strophe hinzufügen');
    expect(html).toContain('Refrain hinzufügen');
    expect(html).toContain('Weiteres Teil');
  });

  it('Editor zeigt Abspielreihenfolge (VerseOrder) und zweisprachige Eingabefelder ohne Roh-Präfixe', () => {
    const song = createEmptySong();
    song.header.title = 'Zweisprachiges Lied';
    song.header.key = 'Bbm';
    song.header.timeSignature = '4/4';
    song.langCount = 2;
    song.verseOrder = ['Vers 1', 'Refrain', 'Vers 1'];
    song.parts.push(
      {
        id: 'p1',
        type: 'strophe',
        name: 'Vers 1',
        lines: ['Amazing grace', '##2 Es klingt zu gut'],
        origin: 'datei',
      },
      {
        id: 'p2',
        type: 'refrain',
        name: 'Refrain',
        lines: ['My chains are gone', '##2 Die Ketten los'],
        origin: 'datei',
      },
    );
    const html = renderToString(
      createElement(Editor, {
        history: {
          song,
          commit: () => {},
          undo: () => {},
          redo: () => {},
          canUndo: false,
          canRedo: false,
          reset: () => {},
        },
        onExit: () => {},
      }),
    );
    expect(html).toContain('Abspielreihenfolge');
    expect(html).toContain('Sprache 1');
    expect(html).toContain('Sprache 2 (Übersetzung)');
    expect(html).toContain('Titel (2. Sprache, freiwillig)');
    expect(html).toContain('2 ausgefüllt');
    // Leitprinzip: ##2 darf niemals sichtbar im Textfeld erscheinen
    expect(html).not.toContain('##2');
  });
});
