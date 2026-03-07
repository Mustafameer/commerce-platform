-- ==========================================
-- Supabase Connection Test Queries
-- ==========================================
-- استخدم هذه الاستعلامات للتحقق من أن كل شيء يعمل بشكل صحيح

-- 1. تحقق من الاتصال الأساسي
SELECT NOW() AS current_time, 'Connection Successful ✅' AS status;

-- 2. تحقق من وجود جميع الجداول
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 3. عد الصفوف في كل جدول
SELECT 
  'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'stores', COUNT(*) FROM stores
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
ORDER BY table_name;

-- 4. عرض أول 5 مستخدمين
SELECT id, name, phone, role, created_at 
FROM users 
LIMIT 5;

-- 5. عرض أول 5 متاجر
SELECT id, store_name, slug, status, is_active, created_at 
FROM stores 
LIMIT 5;

-- 6. عرض أول 5 منتجات
SELECT id, name, price, stock, created_at 
FROM products 
LIMIT 5;

-- 7. عرض أول 5 طلبات
SELECT id, store_id, total_amount, status, created_at 
FROM orders 
LIMIT 5;

-- 8. عرض الإحصائيات الشاملة
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM stores) as total_stores,
  (SELECT COUNT(*) FROM products) as total_products,
  (SELECT COUNT(*) FROM orders) as total_orders,
  (SELECT COUNT(*) FROM customers) as total_customers;

-- 9. تحقق من الفهارس
SELECT 
  tablename, 
  indexname, 
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 10. عرض البيانات المتعلقة بمتجر معين
SELECT 
  s.id, s.store_name, s.slug, s.is_active,
  COUNT(p.id) as product_count,
  COUNT(o.id) as order_count,
  COUNT(c.id) as customer_count
FROM stores s
LEFT JOIN products p ON s.id = p.store_id
LEFT JOIN orders o ON s.id = o.store_id
LEFT JOIN customers c ON s.id = c.store_id
GROUP BY s.id, s.store_name, s.slug, s.is_active
LIMIT 10;

-- 11. البيانات المتعلقة بـ TopUp
SELECT 
  tc.id, tc.name, 
  COUNT(tp.id) as product_count
FROM topup_companies tc
LEFT JOIN topup_products tp ON tc.id = tp.company_id
GROUP BY tc.id, tc.name;

-- 12. عرض أول 10 طلبات مع تفاصيلهم
SELECT 
  o.id, o.store_id, o.total_amount, o.status, o.phone,
  s.store_name, u.name as customer_name
FROM orders o
LEFT JOIN stores s ON o.store_id = s.id
LEFT JOIN users u ON o.customer_id = u.id
ORDER BY o.created_at DESC
LIMIT 10;

-- 13. التحقق من Foreign Keys
SELECT 
  constraint_name, 
  table_name, 
  column_name, 
  referenced_table_name, 
  referenced_column_name
FROM information_schema.key_column_usage
WHERE referenced_table_name IS NOT NULL
  AND table_schema = 'public'
ORDER BY table_name;

-- 14. عرض إصدار PostgreSQL
SELECT version();

-- 15. عرض حجم قاعدة البيانات
SELECT 
  pg_database.datname, 
  pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = current_database();
