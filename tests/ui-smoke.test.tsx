import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import App from '../src/App';

describe('Oberfläche (Smoke-Test)', () => {
  it('Startseite rendert ohne Fehler und zeigt beide großen Knöpfe', () => {
    const html = renderToString(createElement(App));
    expect(html).toContain('Neues Lied');
    expect(html).toContain('Datei öffnen');
    expect(html).toContain('Lieder-Editor');
  });
});
