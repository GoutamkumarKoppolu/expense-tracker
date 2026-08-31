import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

async function isKnownOption(table, value) {
  if (!value) return true;
  const { rows } = await pool.query(`SELECT 1 FROM ${table} WHERE name = $1`, [value]);
  return rows.length > 0;
}

// GET /transactions?months=2026-08,2026-07&tags=Shopping,Food
router.get("/", async (req, res) => {
  try {
    const months = req.query.months
      ? String(req.query.months).split(",").filter(Boolean)
      : [];
    const tags = req.query.tags
      ? String(req.query.tags).split(",").filter(Boolean)
      : [];

    const conditions = [];
    const params = [];

    if (months.length) {
      params.push(months);
      conditions.push(`to_char(date, 'YYYY-MM') = ANY($${params.length}::text[])`);
    }
    if (tags.length) {
      params.push(tags);
      conditions.push(`tag = ANY($${params.length}::text[])`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT t.id, t.type, tt.kind AS type_kind, t.amount, t.tag, t.payment_method,
              t.payment_source, t.date, t.note, t.created_at
       FROM transactions t
       LEFT JOIN transaction_types tt ON tt.name = t.type
       ${where}
       ORDER BY date DESC, created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// GET /transactions/tags - distinct tags used so far, for typeahead/filter options
router.get("/tags", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT tag FROM transactions ORDER BY tag ASC`
    );
    res.json(rows.map((r) => r.tag));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
});

// GET /transactions/overview - all-time totals by kind, independent of any
// month/tag filter the UI currently has applied. Current balance = what's
// actually left in hand: earnings minus expenses minus money moved to savings.
router.get("/overview", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT tt.kind AS kind, COALESCE(SUM(t.amount), 0) AS total
       FROM transactions t
       JOIN transaction_types tt ON tt.name = t.type
       GROUP BY tt.kind`
    );
    const totals = { earning: 0, expense: 0, saving: 0 };
    rows.forEach((r) => {
      if (r.kind in totals) totals[r.kind] = Number(r.total);
    });
    res.json({
      totalEarnings: totals.earning,
      totalExpenses: totals.expense,
      totalSavings: totals.saving,
      balance: totals.earning - totals.expense - totals.saving,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch overview" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { type, amount, tag, payment_method, payment_source, date, note } = req.body;

    if (!(await isKnownOption("transaction_types", type))) {
      return res.status(400).json({ error: "type must be a known transaction type" });
    }
    if (!(Number(amount) > 0)) {
      return res.status(400).json({ error: "amount must be a positive number" });
    }
    if (!tag || !String(tag).trim()) {
      return res.status(400).json({ error: "tag is required" });
    }
    if (!(await isKnownOption("payment_methods", payment_method))) {
      return res.status(400).json({ error: "payment_method must be a known payment method" });
    }
    if (!(await isKnownOption("payment_sources", payment_source))) {
      return res.status(400).json({ error: "payment_source must be a known payment source" });
    }
    if (!date) {
      return res.status(400).json({ error: "date is required" });
    }

    const { rows } = await pool.query(
      `WITH inserted AS (
         INSERT INTO transactions (type, amount, tag, payment_method, payment_source, date, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, type, amount, tag, payment_method, payment_source, date, note, created_at
       )
       SELECT inserted.*, tt.kind AS type_kind
       FROM inserted
       LEFT JOIN transaction_types tt ON tt.name = inserted.type`,
      [type, amount, tag.trim(), payment_method || null, payment_source || null, date, note || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, tag, payment_method, payment_source, date, note } = req.body;

    if (!(await isKnownOption("transaction_types", type))) {
      return res.status(400).json({ error: "type must be a known transaction type" });
    }
    if (!(Number(amount) > 0)) {
      return res.status(400).json({ error: "amount must be a positive number" });
    }
    if (!tag || !String(tag).trim()) {
      return res.status(400).json({ error: "tag is required" });
    }
    if (!(await isKnownOption("payment_methods", payment_method))) {
      return res.status(400).json({ error: "payment_method must be a known payment method" });
    }
    if (!(await isKnownOption("payment_sources", payment_source))) {
      return res.status(400).json({ error: "payment_source must be a known payment source" });
    }
    if (!date) {
      return res.status(400).json({ error: "date is required" });
    }

    const { rows } = await pool.query(
      `WITH updated AS (
         UPDATE transactions
         SET type = $1, amount = $2, tag = $3, payment_method = $4, payment_source = $5, date = $6, note = $7
         WHERE id = $8
         RETURNING id, type, amount, tag, payment_method, payment_source, date, note, created_at
       )
       SELECT updated.*, tt.kind AS type_kind
       FROM updated
       LEFT JOIN transaction_types tt ON tt.name = updated.type`,
      [type, amount, tag.trim(), payment_method || null, payment_source || null, date, note || null, id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update transaction" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query(`DELETE FROM transactions WHERE id = $1`, [id]);
    if (!rowCount) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});

export default router;
