// Reads/writes the whole database for backup and restore.
import { db } from "../../db";
import { getTheme, setTheme } from "../../theme/themeStore";
import { base64ToBlob, blobToBase64 } from "../../platform/files";
import { TABLE_SPECS, buildBackup } from "./backupFormat";

// A table with no spec would be wiped by a restore and never refilled, so
// refuse to run rather than lose data (developer error: add it to TABLE_SPECS).
function assertEveryTableHasSpec() {
  const missing = db.tables.map((t) => t.name).filter((n) => !(n in TABLE_SPECS));
  if (missing.length) throw new Error(`Backup isn't set up for: ${missing.join(", ")}. Please update the app.`);
}

// Files (Blobs, e.g. bill pages) can't go in JSON, so any Blob field is
// written as { $blob: base64, type } and turned back into a Blob on restore.
async function encodeRow(row) {
  const out = { ...row };
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Blob) out[key] = { $blob: await blobToBase64(value), type: value.type };
  }
  return out;
}

function decodeRow(row) {
  const out = { ...row };
  for (const [key, value] of Object.entries(row)) {
    if (value && typeof value === "object" && typeof value.$blob === "string") out[key] = base64ToBlob(value.$blob, value.type);
  }
  return out;
}

export async function exportBackup() {
  assertEveryTableHasSpec();
  const raw = {};
  await db.transaction("r", db.tables, async () => {
    for (const t of db.tables) raw[t.name] = await t.toArray();
  });
  // Encoding reads files, which isn't IndexedDB work, so it happens after
  // the transaction (a transaction closes if it waits on anything else).
  const tables = {};
  for (const [name, rows] of Object.entries(raw)) {
    tables[name] = [];
    for (const row of rows) tables[name].push(await encodeRow(row));
  }
  return buildBackup(tables, { theme: getTheme() });
}

// `parsed` comes from parseBackup(). Replaces everything in one transaction:
// if any write fails, IndexedDB rolls back and the old data stays.
export async function restoreBackup(parsed) {
  assertEveryTableHasSpec();
  // Files are decoded up front for the same reason as in exportBackup.
  const tables = Object.fromEntries(Object.entries(parsed.tables).map(([name, rows]) => [name, rows.map(decodeRow)]));
  await db.transaction("rw", db.tables, async () => {
    for (const t of db.tables) await t.clear();
    for (const t of db.tables) {
      const rows = tables[t.name];
      if (rows?.length) await t.bulkAdd(rows);
    }
  });
  if (parsed.preferences.theme) setTheme(parsed.preferences.theme);
}
