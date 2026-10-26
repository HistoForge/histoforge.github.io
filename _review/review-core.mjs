export const STORAGE_KEY = "histoforge-docs-review-v1";

export function pageKey(path) {
  return path.endsWith("/") ? path + "index.html" : path;
}

export function anchorFor(text, start, end) {
  return {
    start,
    quote: text.slice(start, end),
    prefix: text.slice(Math.max(0, start - 48), start),
    suffix: text.slice(end, end + 48),
  };
}

// Never silently attach a note to an arbitrary occurrence of repeated text.
export function locateAnchor(text, anchor) {
  if (!anchor.quote) return null;
  const matches = [];
  let at = text.indexOf(anchor.quote);
  while (at !== -1) {
    matches.push(at);
    at = text.indexOf(anchor.quote, at + 1);
  }
  const contextual = matches.filter((start) =>
    text.slice(Math.max(0, start - anchor.prefix.length), start) === anchor.prefix &&
    text.slice(start + anchor.quote.length, start + anchor.quote.length + anchor.suffix.length) === anchor.suffix
  );
  if (contextual.length === 1) return contextual[0];
  return matches.length === 1 ? matches[0] : null;
}

export function parseNotes(raw) {
  if (raw === null) return [];
  const data = JSON.parse(raw);
  if (data.version !== 1 || !Array.isArray(data.notes)) throw new Error("Unknown notes format.");
  const ids = new Set();
  for (const note of data.notes) {
    if (!note || typeof note.id !== "string" || ids.has(note.id) ||
        typeof note.page !== "string" || !note.page.startsWith("/") ||
        typeof note.title !== "string" || typeof note.body !== "string" ||
        typeof note.resolved !== "boolean" || typeof note.createdAt !== "string" ||
        typeof note.updatedAt !== "string" || !note.anchor ||
        !Number.isInteger(note.anchor.start) || note.anchor.start < 0 ||
        typeof note.anchor.quote !== "string" || !note.anchor.quote.trim() ||
        typeof note.anchor.prefix !== "string" || typeof note.anchor.suffix !== "string") {
      throw new Error("Invalid saved note. Existing data was not changed.");
    }
    ids.add(note.id);
  }
  return data.notes;
}

export function readNotes(storage) {
  return parseNotes(storage.getItem(STORAGE_KEY));
}

export function saveNote(storage, note) {
  const notes = readNotes(storage);
  const index = notes.findIndex((item) => item.id === note.id);
  if (index === -1) notes.push(note);
  else notes[index] = note;
  const value = JSON.stringify({version: 1, notes});
  parseNotes(value);
  storage.setItem(STORAGE_KEY, value);
  return notes;
}
