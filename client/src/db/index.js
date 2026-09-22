import Dexie from "dexie";
import { STORES } from "./schema";
import { seed } from "./seed";

export const db = new Dexie("expense-tracker");
db.version(1).stores(STORES);

// Fires exactly once, the moment the database is first created — the same
// effect as Postgres's `ON CONFLICT DO NOTHING` seed guard in schema.sql.
db.on("populate", () => seed(db));

// Best-effort: ask Android not to evict this data under storage pressure.
// Silently ignored where unsupported (older WebViews, non-secure origins).
if (typeof navigator !== "undefined" && navigator.storage?.persist) {
  navigator.storage.persist().catch(() => {});
}
