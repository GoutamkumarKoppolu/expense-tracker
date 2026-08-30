import { Router } from "express";
import { pool } from "../db.js";

// Generic CRUD for a simple lookup table of the shape (id, name). The table
// name is always one of the fixed constants below, never request input.
function makeSimpleOptionsRouter(table, label) {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const { rows } = await pool.query(`SELECT id, name FROM ${table} ORDER BY name ASC`);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Failed to fetch ${label}` });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || !String(name).trim()) {
        return res.status(400).json({ error: "name is required" });
      }
      const { rows } = await pool.query(
        `INSERT INTO ${table} (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, name`,
        [String(name).trim()]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Failed to add ${label}` });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { rowCount } = await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
      if (!rowCount) {
        return res.status(404).json({ error: `${label} not found` });
      }
      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Failed to delete ${label}` });
    }
  });

  return router;
}

export const TRANSACTION_KINDS = ["earning", "expense", "saving"];

function makeTransactionTypesRouter() {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT id, name, kind FROM transaction_types ORDER BY name ASC`
      );
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch transaction types" });
    }
  });

  router.post("/", async (req, res) => {
    try {
      const { name, kind } = req.body;
      if (!name || !String(name).trim()) {
        return res.status(400).json({ error: "name is required" });
      }
      if (!TRANSACTION_KINDS.includes(kind)) {
        return res.status(400).json({ error: `kind must be one of ${TRANSACTION_KINDS.join(", ")}` });
      }
      const { rows } = await pool.query(
        `INSERT INTO transaction_types (name, kind) VALUES ($1, $2)
         ON CONFLICT (name) DO UPDATE SET kind = EXCLUDED.kind
         RETURNING id, name, kind`,
        [String(name).trim(), kind]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to add transaction type" });
    }
  });

  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { rowCount } = await pool.query(`DELETE FROM transaction_types WHERE id = $1`, [id]);
      if (!rowCount) {
        return res.status(404).json({ error: "Transaction type not found" });
      }
      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete transaction type" });
    }
  });

  return router;
}

export const transactionTypesRouter = makeTransactionTypesRouter();
export const paymentMethodsRouter = makeSimpleOptionsRouter("payment_methods", "payment method");
export const paymentSourcesRouter = makeSimpleOptionsRouter("payment_sources", "payment source");
