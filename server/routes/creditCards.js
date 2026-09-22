import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// GET /credit-cards - list all cards, oldest first
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, last4, created_at FROM credit_cards ORDER BY created_at ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch credit cards" });
  }
});

// GET /credit-cards/utilization - monthly spend totals per card, all-time.
// The client slices this down to whichever recent months it wants to chart.
router.get("/utilization", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id AS card_id, c.name AS card_name, to_char(t.date, 'YYYY-MM') AS month,
              SUM(t.amount) AS total
       FROM credit_card_transactions t
       JOIN credit_cards c ON c.id = t.card_id
       GROUP BY c.id, c.name, month
       ORDER BY month ASC`
    );
    res.json(rows.map((r) => ({ ...r, total: Number(r.total) })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch card utilization" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, last4 } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "name is required" });
    }
    if (last4 && !/^\d{4}$/.test(String(last4))) {
      return res.status(400).json({ error: "last4 must be exactly 4 digits" });
    }

    const { rows } = await pool.query(
      `INSERT INTO credit_cards (name, last4) VALUES ($1, $2)
       RETURNING id, name, last4, created_at`,
      [String(name).trim(), last4 || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add credit card" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query(`DELETE FROM credit_cards WHERE id = $1`, [id]);
    if (!rowCount) {
      return res.status(404).json({ error: "Credit card not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete credit card" });
  }
});

// GET /credit-cards/:id/transactions?months=2026-08,2026-07
router.get("/:id/transactions", async (req, res) => {
  try {
    const { id } = req.params;
    const months = req.query.months
      ? String(req.query.months).split(",").filter(Boolean)
      : [];

    const conditions = ["card_id = $1"];
    const params = [id];
    if (months.length) {
      params.push(months);
      conditions.push(`to_char(date, 'YYYY-MM') = ANY($${params.length}::text[])`);
    }

    const { rows } = await pool.query(
      `SELECT id, card_id, amount, description, date, created_at
       FROM credit_card_transactions
       WHERE ${conditions.join(" AND ")}
       ORDER BY date DESC, created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch card transactions" });
  }
});

router.post("/:id/transactions", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, date } = req.body;

    const { rows: cardRows } = await pool.query(`SELECT id FROM credit_cards WHERE id = $1`, [id]);
    if (!cardRows.length) {
      return res.status(404).json({ error: "Credit card not found" });
    }
    if (!(Number(amount) > 0)) {
      return res.status(400).json({ error: "amount must be a positive number" });
    }
    if (!description || !String(description).trim()) {
      return res.status(400).json({ error: "description is required" });
    }
    if (!date) {
      return res.status(400).json({ error: "date is required" });
    }

    const { rows } = await pool.query(
      `INSERT INTO credit_card_transactions (card_id, amount, description, date)
       VALUES ($1, $2, $3, $4)
       RETURNING id, card_id, amount, description, date, created_at`,
      [id, amount, String(description).trim(), date]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add card transaction" });
  }
});

router.delete("/:id/transactions/:txId", async (req, res) => {
  try {
    const { id, txId } = req.params;
    const { rowCount } = await pool.query(
      `DELETE FROM credit_card_transactions WHERE id = $1 AND card_id = $2`,
      [txId, id]
    );
    if (!rowCount) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete card transaction" });
  }
});

export default router;
