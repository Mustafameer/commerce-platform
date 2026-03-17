-- Check orders data
SELECT id, store_id, total_amount, status FROM orders;

-- Check stores data  
SELECT id, store_name, owner_name, percentage_enabled, commission_percentage FROM stores;

-- Check if orders have NULL total_amount
SELECT COUNT(*) as null_amounts FROM orders WHERE total_amount IS NULL;

-- Add sample order if needed
INSERT INTO orders (customer_id, store_id, total_amount, status) 
VALUES (1, 1, 50000, 'completed') 
ON CONFLICT DO NOTHING;
