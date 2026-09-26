// Open bottom sheets, innermost last, so Escape and the Android Back button
// close only the top one: an info sheet can open on top of the
// add-transaction sheet. Entries: { id, close }.
const openSheets = [];

export function pushSheet(entry) {
  openSheets.push(entry);
  return () => openSheets.splice(openSheets.indexOf(entry), 1);
}

export const isTopSheet = (id) => openSheets[openSheets.length - 1]?.id === id;

// Closes the topmost open sheet. Returns false if none is open.
export function closeTopSheet() {
  const top = openSheets[openSheets.length - 1];
  if (!top) return false;
  top.close();
  return true;
}
