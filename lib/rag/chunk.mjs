// Splits a policy file into one chunk per numbered section ("1. Return window").
// Each chunk repeats the document title and section heading so it stands alone
// when retrieved. Long sections are split further on line boundaries.
const MAX_CHARS = 900;

export function chunkDocument(text) {
  const lines = text.replace(/\r/g, "").split("\n");
  const title = lines.find((l) => l.trim())?.trim() ?? "Untitled";

  const sections = [];
  let current = null;
  for (const line of lines.slice(1)) {
    const heading = line.match(/^\d+\.\s+(.+)$/);
    if (heading) {
      current = { heading: heading[1].trim(), body: [] };
      sections.push(current);
    } else if (current) {
      current.body.push(line);
    } // text before the first heading is boilerplate (date, "fictional company") and is skipped
  }

  const chunks = [];
  for (const { heading, body } of sections) {
    const parts = [];
    let buf = "";
    for (const line of body.join("\n").trim().split("\n")) {
      if (buf && (buf + "\n" + line).length > MAX_CHARS) {
        parts.push(buf.trim());
        buf = "";
      }
      buf += (buf ? "\n" : "") + line;
    }
    if (buf.trim()) parts.push(buf.trim());

    parts.forEach((part, i) => {
      const label = parts.length > 1 ? `${heading} (part ${i + 1})` : heading;
      chunks.push({ title, section: label, content: `${title} — ${label}\n${part}` });
    });
  }
  return chunks;
}
