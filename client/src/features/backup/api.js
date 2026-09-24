// Reads/writes the whole database for backup and restore.
import { db } from "../../db";
import { getTheme, setTheme } from "../../theme/themeStore";
import { TABLE_SPECS, buildBackup } from "./backupFormat";

// A table with no spec would be wiped by a restore and never refilled, so
// refuse to run rather than lose data (developer error: add it to TABLE_SPECS).
function assertEveryTableHasSpec() {
  const missing = db.tables.map((t) => t.name).filter((n) => !(n in TABLE_SPECS));
  if (missing.length) throw new Error(`Backup isn't set up for: ${missing.join(", ")}. Please update the app.`);
}

export async function exportBackup() {
  assertEveryTableHasSpec();
  const tables = {};
  await db.transaction("r", db.tables, async () => {
    for (const t of db.tables) tables[t.name] = await t.toArray();
  });
  return buildBackup(tables, { theme: getTheme() });
}

// `parsed` comes from parseBackup(). Replaces everything in one transaction:
// if any write fails, IndexedDB rolls back and the old data stays.
export async function restoreBackup(parsed) {
  assertEveryTableHasSpec();
  await db.transaction("rw", db.tables, async () => {
    for (const t of db.tables) await t.clear();
    for (const t of db.tables) {
      const rows = parsed.tables[t.name];
      if (rows?.length) await t.bulkAdd(rows);
    }
  });
  if (parsed.preferences.theme) setTheme(parsed.preferences.theme);
}
