-- ============================================
-- MANJULA MILK FORMING - Migration: Customer Auth + Orders
-- ============================================
-- Safe to run on an EXISTING database. Every statement is idempotent
-- (IF NOT EXISTS / DROP ... IF EXISTS), so re-running it will NOT error.
-- Run this in the Supabase SQL Editor.

-- --------------------------------------------
-- 1. Extend CUSTOMERS for customer login + GPS
-- --------------------------------------------
ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,6);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,6);

-- Phone number is the customer login id, so it must be unique.
-- Partial index ignores existing NULL phone numbers (admin-created customers).
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_mobile_unique
  ON customers(mobile_number)
  WHERE mobile_number IS NOT NULL;

-- --------------------------------------------
-- 2. ORDERS TABLE (customer milk orders)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  order_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  quantity_liters NUMERIC(10,3) NOT NULL,
  rate_per_liter NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  latitude NUMERIC(10,6),
  longitude NUMERIC(10,6),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, delivered, cancelled
  payment_method TEXT,                    -- Cash, UPI, Billing (set on delivery)
  notes TEXT,
  daily_entry_id UUID REFERENCES daily_entries(entry_id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments(payment_id) ON DELETE SET NULL,
  ordered_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_ordered_at ON orders(ordered_at);

-- --------------------------------------------
-- 3. ROW LEVEL SECURITY (match existing tables)
-- --------------------------------------------
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated" ON orders;
CREATE POLICY "Allow all for authenticated" ON orders
  FOR ALL USING (true) WITH CHECK (true);
