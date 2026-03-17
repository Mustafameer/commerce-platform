-- Check data for store 13
SELECT 'Categories' as table_name, COUNT(*) as count FROM topup_product_categories WHERE store_id = 13
UNION ALL
SELECT 'Companies', COUNT(*) FROM topup_companies WHERE store_id = 13
UNION ALL
SELECT 'Products', COUNT(*) FROM topup_products WHERE store_id = 13;

-- Show sample data
SELECT 'Sample Categories' as info;
SELECT id, name FROM topup_product_categories WHERE store_id = 13 LIMIT 3;

SELECT 'Sample Companies' as info;
SELECT id, name FROM topup_companies WHERE store_id = 13 LIMIT 3;

SELECT 'Sample Products' as info;
SELECT id, company_id, amount, price FROM topup_products WHERE store_id = 13 LIMIT 3;
