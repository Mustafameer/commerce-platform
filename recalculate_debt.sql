-- Recalculate customer debt based on: opening_balance + purchases - payments
BEGIN TRANSACTION;

-- First, verify the formula for each customer
SELECT 
  tc.id,
  tc.name,
  tc.phone,
  tc.starting_balance,
  COALESCE(SUM(CASE WHEN to2.id IS NOT NULL THEN o.total_amount ELSE 0 END), 0) as total_purchases,
  COALESCE(SUM(CASE WHEN cp.id IS NOT NULL THEN cp.amount ELSE 0 END), 0) as total_payments,
  tc.starting_balance + COALESCE(SUM(CASE WHEN to2.id IS NOT NULL THEN o.total_amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN cp.id IS NOT NULL THEN cp.amount ELSE 0 END), 0) as correct_debt,
  tc.current_debt as old_debt
FROM topup_customers tc
LEFT JOIN topup_orders o ON tc.id = o.customer_id
LEFT JOIN topup_orders to2 ON tc.id = to2.customer_id
LEFT JOIN customer_payments cp ON tc.id = cp.customer_id
GROUP BY tc.id, tc.name, tc.phone, tc.starting_balance, tc.current_debt;

-- Update customer_debt to be correct
UPDATE topup_customers tc
SET current_debt = tc.starting_balance + COALESCE(
  (SELECT COALESCE(SUM(total_amount), 0) FROM topup_orders WHERE customer_id = tc.id),
  0
) - COALESCE(
  (SELECT COALESCE(SUM(amount), 0) FROM customer_payments WHERE customer_id = tc.id),
  0
),
updated_at = NOW();

COMMIT;
