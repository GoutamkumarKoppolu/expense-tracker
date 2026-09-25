// Pure bill rules. Folders hold bills; a bill has one or more pages (a photo
// or a PDF each), kept exactly as uploaded. Nothing inside a file is read.

export const ACCEPT = "image/*,application/pdf";
export const MAX_FILE_BYTES = 50 * 1024 * 1024;

// "pdf" | "image" | null (unsupported).
export function pageKind(type) {
  if (type === "application/pdf") return "pdf";
  if (typeof type === "string" && type.startsWith("image/")) return "image";
  return null;
}

// Throws an Error with a user-facing message if the file can't be stored.
export function checkFile(file) {
  if (!pageKind(file.type)) throw new Error(`"${file.name}" isn't a photo or a PDF`);
  if (!file.size) throw new Error(`"${file.name}" is empty`);
  if (file.size > MAX_FILE_BYTES) throw new Error(`"${file.name}" is over ${MAX_FILE_BYTES / (1024 * 1024)} MB`);
}

// "IMG_2026-09-25_electricity.pdf" → "IMG 2026-09-25 electricity".
export function defaultBillName(fileName) {
  const base = String(fileName || "").replace(/\.[^.]+$/, "");
  return base.replace(/[_]+/g, " ").replace(/\s+/g, " ").trim() || "Bill";
}

const byPosition = (a, b) => a.position - b.position || a.id - b.id;
const newestFirst = (a, b) => String(b.created_at).localeCompare(String(a.created_at)) || b.id - a.id;

// Bills with their pages in order, total size, and the page to show as the
// tile (the first page with a preview image, else the first page).
export function summarizeBills(bills, pages) {
  const byBill = new Map();
  pages.forEach((p) => {
    if (!byBill.has(p.bill_id)) byBill.set(p.bill_id, []);
    byBill.get(p.bill_id).push(p);
  });
  return bills
    .map((b) => {
      const own = (byBill.get(b.id) || []).sort(byPosition);
      return {
        ...b,
        pages: own,
        pageCount: own.length,
        size: own.reduce((sum, p) => sum + (p.size || 0), 0),
        cover: own.find((p) => p.thumb) || own[0] || null,
      };
    })
    .sort(newestFirst);
}

// Folders A→Z with how many bills they hold, their size and a cover (from
// the newest bill that has a preview).
export function summarizeFolders(folders, billSummaries) {
  return folders
    .map((f) => {
      const own = billSummaries.filter((b) => b.folder_id === f.id);
      return {
        ...f,
        billCount: own.length,
        size: own.reduce((sum, b) => sum + b.size, 0),
        cover: own.find((b) => b.cover?.thumb)?.cover || null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

// Case-insensitive search over bill names (and their folder's name).
export function searchBills(billSummaries, folders, query) {
  const q = query.trim().toLowerCase();
  if (!q) return billSummaries;
  const folderName = new Map(folders.map((f) => [f.id, f.name.toLowerCase()]));
  return billSummaries.filter((b) => b.name.toLowerCase().includes(q) || folderName.get(b.folder_id)?.includes(q));
}

// Positions for pages appended after the existing ones.
export function nextPositions(existingPages, count) {
  const start = existingPages.reduce((max, p) => Math.max(max, p.position), -1) + 1;
  return Array.from({ length: count }, (_, i) => start + i);
}

export const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();
