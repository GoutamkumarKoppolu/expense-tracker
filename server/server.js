import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import transactionsRouter from "./routes/transactions.js";
import {
  transactionTypesRouter,
  paymentMethodsRouter,
  paymentSourcesRouter,
} from "./routes/options.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/transactions", transactionsRouter);
app.use("/transaction-types", transactionTypesRouter);
app.use("/payment-methods", paymentMethodsRouter);
app.use("/payment-sources", paymentSourcesRouter);

app.get("/health", (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Expense tracker API listening on http://localhost:${port}`);
});
