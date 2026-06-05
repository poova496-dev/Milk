-- ============================================
-- MANJULA MILK FORMING - Migration: per-entry billed flag
-- ============================================
-- Safe to run on an EXISTING database (idempotent).
-- Adds an explicit is_billed flag to daily_entries so an entry's billed status
-- no longer depends on date-range overlap (which wrongly flagged "Billing"
-- order entries as billed when a same-day Cash/UPI payment existed).
-- Run this in the Supabase SQL Editor.

ALTER TABLE daily_entries ADD COLUMN IF NOT EXISTS is_billed BOOLEAN DEFAULT FALSE;

-- Backfill: entries already covered by a real (multi-day) bill are billed.
-- Single-day payments (bill_start = bill_end) are point payments such as
-- Cash/UPI on delivery, so they are excluded from this backfill.
UPDATE daily_entries d
SET is_billed = TRUE
FROM payments p
WHERE d.customer_id = p.customer_id
  AND d.entry_date BETWEEN p.bill_start_date AND p.bill_end_date
  AND p.bill_start_date <> p.bill_end_date
  AND d.is_billed IS DISTINCT FROM TRUE;
