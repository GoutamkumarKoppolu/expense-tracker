CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(10) NOT NULL CHECK (type IN ('earning', 'expense')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  tag VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);
CREATE INDEX IF NOT EXISTS idx_transactions_tag ON transactions (tag);
