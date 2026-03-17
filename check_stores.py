import psycopg2

conn = psycopg2.connect(
    host="localhost",
    database="multi_ecommerce",
    user="postgres",
    password="123"
)

cur = conn.cursor()

print("🔍 جاري التحقق من حالة المتاجر...\n")

# Check all stores
cur.execute('SELECT id, store_name, owner_id, owner_phone, is_active, status FROM stores ORDER BY id DESC')
stores = cur.fetchall()

print("📊 جميع المتاجر في قاعدة البيانات:")
print("════════════════════════════════════════════════")
if len(stores) == 0:
    print("   ❌ لا توجد متاجر")
else:
    for store in stores:
        store_id, store_name, owner_id, owner_phone, is_active, status = store
        status_icon = '✅' if is_active else '❌'
        approval_icon = '✅' if status == 'approved' else '⚠️'
        print(f"   {status_icon} المتجر {store_id}: \"{store_name}\"")
        print(f"      • الصاحب: {owner_phone} (ID: {owner_id})")
        print(f"      • حالة التفعيل: {'مفعل' if is_active else 'معطل'}")
        print(f"      • حالة الموافقة: {approval_icon} {status}")
        print()

cur.close()
conn.close()
print("✅ انتهى الفحص")
