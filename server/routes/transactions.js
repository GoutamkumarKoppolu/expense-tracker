import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

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
      `SELECT id, type, amount, tag, date, note, created_at
       FROM transactions
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

router.post("/", async (req, res) => {
  try {
    const { type, amount, tag, date, note } = req.body;

    if (!["earning", "expense"].includes(type)) {
      return res.status(400).json({ error: "type must be 'earning' or 'expense'" });
    }
    if (!(Number(amount) > 0)) {
      return res.status(400).json({ error: "amount must be a positive number" });
    }
    if (!tag || !String(tag).trim()) {
      return res.status(400).json({ error: "tag is required" });
    }
    if (!date) {
      return res.status(400).json({ error: "date is required" });
    }

    const { rows } = await pool.query(
      `INSERT INTO transactions (type, amount, tag, date, note)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, type, amount, tag, date, note, created_at`,
      [type, amount, tag.trim(), date, note || null]
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
    const { type, amount, tag, date, note } = req.body;

    if (!["earning", "expense"].includes(type)) {
      return res.status(400).json({ error: "type must be 'earning' or 'expense'" });
    }
    if (!(Number(amount) > 0)) {
      return res.status(400).json({ error: "amount must be a positive number" });
    }
    if (!tag || !String(tag).trim()) {
      return res.status(400).json({ error: "tag is required" });
    }
    if (!date) {
      return res.status(400).json({ error: "date is required" });
    }

    const { rows } = await pool.query(
      `UPDATE transactions
       SET type = $1, amount = $2, tag = $3, date = $4, note = $5
       WHERE id = $6
       RETURNING id, type, amount, tag, date, note, created_at`,
      [type, amount, tag.trim(), date, note || null, id]
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
