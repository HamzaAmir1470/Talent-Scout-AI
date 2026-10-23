export const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

export interface TocItem { level: 2 | 3; text: string; id: string }

/** Reads ## and ### headings from markdown, skipping fenced code blocks. */
export function extractToc(markdown: string): TocItem[] {
  const out: TocItem[] = [];
  let fence = false;
  for (const line of markdown.split('\n')) {
    if (/^(```|~~~)/.test(line.trim())) { fence = !fence; continue; }
    if (fence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!m) continue;
    const text = m[2].replace(/[*_`]/g, '');
    out.push({ level: m[1].length as 2 | 3, text, id: slugify(text) });
  }
  return out;
}
