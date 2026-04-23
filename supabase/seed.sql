-- ============================================
-- MANJULA MILK FORMING - Sample Seed Data
-- ============================================

-- Sample Customers
INSERT INTO customers (customer_name, mobile_number, is_active) VALUES
('Ravi Kumar', '9876543210', true),
('Lakshmi Devi', '9876543211', true),
('Murugan S', '9876543212', true),
('Priya M', NULL, true),
('Selvam K', '9876543214', false);

-- Sample Milk Rate
INSERT INTO milk_rates (rate_name, rate_per_liter, rate_for_1_liter, rate_for_half_liter, rate_for_quarter_liter, rate_for_1_75_liter, effective_from, is_active) VALUES
('Standard Rate April 2026', 40.00, 40.00, 20.00, 10.00, 70.00, '2026-04-01', true);

-- Sample Daily Entries (last 5 days for Ravi Kumar)
INSERT INTO daily_entries (customer_id, customer_name, entry_date, milk_type_selected, quantity_liters, rate_per_liter_used, total_amount)
SELECT c.customer_id, 'Ravi Kumar', CURRENT_DATE - INTERVAL '4 days', '0.5', 0.5, 40.00, 20.00
FROM customers c WHERE c.customer_name = 'Ravi Kumar';

INSERT INTO daily_entries (customer_id, customer_name, entry_date, milk_type_selected, quantity_liters, rate_per_liter_used, total_amount)
SELECT c.customer_id, 'Ravi Kumar', CURRENT_DATE - INTERVAL '3 days', '0.5', 0.5, 40.00, 20.00
FROM customers c WHERE c.customer_name = 'Ravi Kumar';

INSERT INTO daily_entries (customer_id, customer_name, entry_date, milk_type_selected, quantity_liters, rate_per_liter_used, total_amount)
SELECT c.customer_id, 'Ravi Kumar', CURRENT_DATE - INTERVAL '2 days', '1', 1.0, 40.00, 40.00
FROM customers c WHERE c.customer_name = 'Ravi Kumar';

INSERT INTO daily_entries (customer_id, customer_name, entry_date, milk_type_selected, quantity_liters, rate_per_liter_used, total_amount)
SELECT c.customer_id, 'Ravi Kumar', CURRENT_DATE - INTERVAL '1 day', '0.5', 0.5, 40.00, 20.00
FROM customers c WHERE c.customer_name = 'Ravi Kumar';

INSERT INTO daily_entries (customer_id, customer_name, entry_date, milk_type_selected, quantity_liters, rate_per_liter_used, total_amount)
SELECT c.customer_id, 'Ravi Kumar', CURRENT_DATE, '0.5', 0.5, 40.00, 20.00
FROM customers c WHERE c.customer_name = 'Ravi Kumar';

-- Sample Daily Entries for Lakshmi Devi
INSERT INTO daily_entries (customer_id, customer_name, entry_date, milk_type_selected, quantity_liters, rate_per_liter_used, total_amount)
SELECT c.customer_id, 'Lakshmi Devi', CURRENT_DATE - INTERVAL '2 days', '1', 1.0, 40.00, 40.00
FROM customers c WHERE c.customer_name = 'Lakshmi Devi';

INSERT INTO daily_entries (customer_id, customer_name, entry_date, milk_type_selected, quantity_liters, rate_per_liter_used, total_amount)
SELECT c.customer_id, 'Lakshmi Devi', CURRENT_DATE - INTERVAL '1 day', '1', 1.0, 40.00, 40.00
FROM customers c WHERE c.customer_name = 'Lakshmi Devi';

INSERT INTO daily_entries (customer_id, customer_name, entry_date, milk_type_selected, quantity_liters, rate_per_liter_used, total_amount)
SELECT c.customer_id, 'Lakshmi Devi', CURRENT_DATE, '0.5', 0.5, 40.00, 20.00
FROM customers c WHERE c.customer_name = 'Lakshmi Devi';

-- Sample Daily Entries for Murugan S
INSERT INTO daily_entries (customer_id, customer_name, entry_date, milk_type_selected, quantity_liters, rate_per_liter_used, total_amount)
SELECT c.customer_id, 'Murugan S', CURRENT_DATE, '1.75', 1.75, 40.00, 70.00
FROM customers c WHERE c.customer_name = 'Murugan S';

-- Sample Payment
INSERT INTO payments (customer_id, bill_start_date, bill_end_date, total_liters, total_amount, paid_amount, payment_date, payment_method, notes)
SELECT c.customer_id, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '5 days', 5.0, 200.00, 200.00, CURRENT_DATE - INTERVAL '5 days', 'Cash', 'Full payment collected'
FROM customers c WHERE c.customer_name = 'Ravi Kumar';
