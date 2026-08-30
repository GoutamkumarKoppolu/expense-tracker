CREATE TABLE IF NOT EXISTS transaction_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  kind VARCHAR(10) NOT NULL DEFAULT 'expense'
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

-- Migrate a pre-existing transaction_types table that predates the kind column.
ALTER TABLE transaction_types ADD COLUMN IF NOT EXISTS kind VARCHAR(10) NOT NULL DEFAULT 'expense';

INSERT INTO transaction_types (name, kind) VALUES ('expense', 'expense'), ('earning', 'earning'), ('saving', 'saving')
  ON CONFLICT (name) DO NOTHING;
UPDATE transaction_types SET kind = 'earning' WHERE name = 'earning' AND kind <> 'earning';
UPDATE transaction_types SET kind = 'saving' WHERE name = 'saving' AND kind <> 'saving';

INSERT INTO payment_methods (name) VALUES ('Cash'), ('Card'), ('UPI'), ('Bank Transfer')
  ON CONFLICT (name) DO NOTHING;
INSERT INTO payment_sources (name) VALUES ('PhonePe'), ('Google Pay'), ('Paytm')
  ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  tag VARCHAR(50) NOT NULL,
  payment_method VARCHAR(50),
  payment_source VARCHAR(50),
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Migrate a pre-existing transactions table (created before payment
-- method/source and customizable types were added) to the current shape.
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ALTER COLUMN type TYPE VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_source VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);
CREATE INDEX IF NOT EXISTS idx_transactions_tag ON transactions (tag);
