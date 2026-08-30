import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

// Keep DATE columns as raw 'YYYY-MM-DD' strings. pg's default parser builds a
// local-timezone Date object, which shifts a day off once JSON-serialized in
// timezones ahead of UTC (e.g. IST) — a silent off-by-one on every date field.
pg.types.setTypeParser(1082, (val) => val);

export const pool = new pg.Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});
