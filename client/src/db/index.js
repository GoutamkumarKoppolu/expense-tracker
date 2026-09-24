import Dexie from "dexie";
import { STORES, STORES_V2 } from "./schema";
import { seed } from "./seed";

export const db = new Dexie("expense-tracker");
// Never edit an existing version: installed apps already have it. Add a new
// version with only the changed stores instead.
db.version(1).stores(STORES);
db.version(2).stores(STORES_V2);

// Fires exactly once, the moment the database is first created — the same
// effect as Postgres's `ON CONFLICT DO NOTHING` seed guard in schema.sql.
db.on("populate", () => seed(db));

// Best-effort: ask Android not to evict this data under storage pressure.
// Silently ignored where unsupported (older WebViews, non-secure origins).
if (typeof navigator !== "undefined" && navigator.storage?.persist) {
  navigator.storage.persist().catch(() => {});
}
