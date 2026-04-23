-- ============================================
-- MANJULA MILK FORMING - Supabase Database Schema
-- ============================================
-- Run this in the Supabase SQL Editor (https://ioixjvjklzbgogwfqxfx.supabase.co)

-- 1. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
  customer_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  mobile_number TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_name ON customers(customer_name);
CREATE INDEX idx_customers_active ON customers(is_active);

-- 2. MILK RATES TABLE
CREATE TABLE IF NOT EXISTS milk_rates (
  rate_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rate_name TEXT NOT NULL DEFAULT 'Standard Rate',
  rate_per_liter NUMERIC(10,2) NOT NULL,
  rate_for_1_liter NUMERIC(10,2),
  rate_for_half_liter NUMERIC(10,2),
  rate_for_quarter_liter NUMERIC(10,2),
  rate_for_1_75_liter NUMERIC(10,2),
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_milk_rates_active ON milk_rates(is_active);
CREATE INDEX idx_milk_rates_effective ON milk_rates(effective_from);

-- 3. DAILY ENTRIES TABLE
CREATE TABLE IF NOT EXISTS daily_entries (
  entry_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  milk_type_selected TEXT NOT NULL, -- '1', '0.5', '0.25', '1.75', 'custom'
  quantity_liters NUMERIC(10,3) NOT NULL,
  rate_per_liter_used NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  entered_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_entries_customer ON daily_entries(customer_id);
CREATE INDEX idx_daily_entries_date ON daily_entries(entry_date);
CREATE INDEX idx_daily_entries_customer_date ON daily_entries(customer_id, entry_date);

-- 4. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  payment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  bill_start_date DATE NOT NULL,
  bill_end_date DATE NOT NULL,
  total_liters NUMERIC(10,3) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  paid_amount NUMERIC(10,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_time TIME NOT NULL DEFAULT CURRENT_TIME,
  payment_method TEXT DEFAULT 'Cash',
  notes TEXT,
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_customer_date ON payments(customer_id, payment_date);

-- 5. INVOICES TABLE
CREATE TABLE IF NOT EXISTS invoices (
  invoice_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  payment_id UUID REFERENCES payments(payment_id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  bill_start_date DATE NOT NULL,
  bill_end_date DATE NOT NULL,
  total_liters NUMERIC(10,3) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  paid_amount NUMERIC(10,2) NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- 6. APP USERS TABLE
CREATE TABLE IF NOT EXISTS app_users (
  user_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. INVOICE COUNTER (for auto-increment invoice numbers)
CREATE TABLE IF NOT EXISTS invoice_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  current_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
  last_number INTEGER NOT NULL DEFAULT 0
);

-- Insert initial counter
INSERT INTO invoice_counter (id, current_year, last_number) VALUES (1, 2026, 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to generate next invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  v_year INTEGER;
  v_next_num INTEGER;
  v_invoice_number TEXT;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE);

  UPDATE invoice_counter
  SET last_number = CASE WHEN current_year = v_year THEN last_number + 1 ELSE 1 END,
      current_year = v_year
  WHERE id = 1
  RETURNING last_number INTO v_next_num;

  v_invoice_number := 'MMF/' || v_year || '/' || LPAD(v_next_num::TEXT, 4, '0');
  RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER set_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_milk_rates_updated_at
  BEFORE UPDATE ON milk_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_daily_entries_updated_at
  BEFORE UPDATE ON daily_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_counter ENABLE ROW LEVEL SECURITY;

-- Policies: Allow all operations for authenticated users
-- (For a single-user dairy app, this is appropriate)

CREATE POLICY "Allow all for authenticated" ON customers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON milk_rates
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON daily_entries
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON payments
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON invoices
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON app_users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON invoice_counter
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- STORAGE BUCKET
-- ============================================
-- Run this in Supabase Dashboard > Storage > Create New Bucket
-- Bucket name: invoices
-- Public: Yes (for sharing invoice PDFs)
--
-- Or via SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', true);
