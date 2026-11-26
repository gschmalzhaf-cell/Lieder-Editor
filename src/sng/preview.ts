/**
 * Bereitet SongBeamer-Textzeilen sicher für die Folien-Vorschau auf (ohne HTML-Injection).
 * - `#H ...` (Kommentar/Regieanweisung) wird auf der Projektion ausgeblendet.
 * - `--` und `--A` werden als dezente Trennlinie dargestellt.
 * - `#0 `, `#1 `..`#4 `, `##1 `..`##4 `, `#C ` werden als Steuerzeichen erkannt und entfernt.
 * - Inline-Formatierungen (`<b>`, `<i>`, `<u>`, `<br>`, `<c:...>`, `<color:...>`) werden
 *   in sichere Text-Segmente zerlegt.
 */

export interface PreviewSpan {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

export type PreviewLine =
  | { kind: 'blank' }
  | { kind: 'break' }
  | { kind: 'text'; spans: PreviewSpan[]; lang: number; subtitle: boolean };

const PREFIX_RE = /^(#H |#0 |#C |##([1-4]) |#([1-4]) )/i;
const TAG_RE = /<(\/?)(b|i|u|br|c|color)(?::[^>]*)?>/gi;

function parseInlineSpans(text: string): PreviewSpan[][] {
  const rows: PreviewSpan[][] = [[]];
  let bold = false;
  let italic = false;
  let underline = false;
  let lastIndex = 0;

  TAG_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TAG_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      rows[rows.length - 1].push({
        text: text.slice(lastIndex, match.index),
        bold,
        italic,
        underline,
      });
    }
    const closing = match[1] === '/';
    const tag = match[2].toLowerCase();
    if (tag === 'b') bold = !closing;
    else if (tag === 'i') italic = !closing;
    else if (tag === 'u') underline = !closing;
    else if (tag === 'br' && !closing) rows.push([]);
    // <c:...> / <color:...> werden in der Vorschau sauber entfernt (kein roher Tag-Text)
    lastIndex = TAG_RE.lastIndex;
  }

  if (lastIndex < text.length) {
    rows[rows.length - 1].push({
      text: text.slice(lastIndex),
      bold,
      italic,
      underline,
    });
  }

  return rows;
}

export function buildPreviewLines(rawLines: string[], langCount = 1): PreviewLine[] {
  const result: PreviewLine[] = [];
  const effectiveLangs = Math.max(1, Math.min(4, Number.isFinite(langCount) ? langCount : 1));
  let autoLangIndex = 0;

  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (trimmed === '') {
      result.push({ kind: 'blank' });
      continue;
    }
    if (trimmed === '--' || trimmed === '--A' || trimmed === '--a') {
      result.push({ kind: 'break' });
      continue;
    }

    let content = raw;
    let lang = 1;
    let subtitle = false;

    const pm = PREFIX_RE.exec(raw);
    if (pm) {
      const token = pm[1].toUpperCase();
      if (token === '#H ') {
        // Ausgeblendete Kommentarzeile – erscheint nicht auf der Beamer-Folie
        continue;
      }
      content = raw.slice(pm[0].length);
      if (token === '#0 ') {
        subtitle = true;
      } else if (pm[2]) {
        lang = Number(pm[2]);
      } else if (pm[3]) {
        lang = Number(pm[3]);
      }
    } else if (effectiveLangs > 1) {
      lang = (autoLangIndex % effectiveLangs) + 1;
      autoLangIndex += 1;
    }

    const spanRows = parseInlineSpans(content);
    for (const spans of spanRows) {
      const hasContent = spans.some((s) => s.text.trim() !== '');
      if (!hasContent) {
        result.push({ kind: 'blank' });
      } else {
        result.push({ kind: 'text', spans, lang, subtitle });
      }
    }
  }

  // Abschließende leere Zeilen am Folienende nicht als leeren Block anhängen
  while (result.length > 0 && result[result.length - 1].kind === 'blank') {
    result.pop();
  }

  return result;
}
