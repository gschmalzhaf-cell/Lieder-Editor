/**
 * Dateiname aus dem Titel: Leerzeichen werden zu Unterstrichen,
 * Sonderzeichen werden entfernt, Endung .sng.
 * Beispiel: „Näher, mein Gott, zu Dir“ -> „Näher_mein_Gott_zu_Dir.sng“
 */
export function sngFilename(title: string): string {
  const cleaned = title
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\p{L}\p{N}_-]/gu, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `${cleaned || 'lied'}.sng`;
}
