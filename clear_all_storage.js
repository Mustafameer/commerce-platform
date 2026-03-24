// 🧹 حل شامل لمسح جميع البيانات المخزنة في المتصفح
console.log('🚀 جاري مسح جميع البيانات...\n');

// 1️⃣ مسح localStorage
console.log('1️⃣ مسح localStorage...');
localStorage.clear();
console.log('   ✅ تم');

// 2️⃣ مسح sessionStorage
console.log('2️⃣ مسح sessionStorage...');
sessionStorage.clear();
console.log('   ✅ تم');

// 3️⃣ مسح Cookies
console.log('3️⃣ مسح جميع الـ Cookies...');
document.cookie.split(";").forEach((c) => {
  const n = c.split("=")[0].trim();
  if (n) {
    document.cookie = n + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/";
    document.cookie = n + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=" + window.location.hostname;
  }
});
console.log('   ✅ تم');

// 4️⃣ مسح IndexedDB
console.log('4️⃣ مسح IndexedDB...');
if (window.indexedDB) {
  const DBNames = await new Promise((resolve, reject) => {
    if (indexedDB.databases) {
      indexedDB.databases().then(dbs => {
        resolve(dbs.map(db => db.name));
      }).catch(reject);
    } else {
      resolve([]);
    }
  });

  for (const dbName of DBNames) {
    const request = indexedDB.deleteDatabase(dbName);
    await new Promise((resolve, reject) => {
      request.onerror = reject;
      request.onsuccess = resolve;
    });
    console.log(`   ✓ تم حذف: ${dbName}`);
  }
}
console.log('   ✅ تم');

// 5️⃣ مسح Service Workers
console.log('5️⃣ مسح Service Workers...');
if (navigator.serviceWorker) {
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (let reg of registrations) {
    await reg.unregister();
  }
  console.log('   ✅ تم');
}

// 6️⃣ مسح Cache Storage
console.log('6️⃣ مسح Cache Storage...');
if (caches) {
  const cacheNames = await caches.keys();
  for (let cacheName of cacheNames) {
    await caches.delete(cacheName);
  }
  console.log('   ✅ تم');
}

console.log('\n✅ تم مسح جميع البيانات المخزنة!');
console.log('🔄 جاري إعادة تحميل الصفحة...\n');

// تأخير ثم إعادة التحميل
setTimeout(() => {
  location.reload(true); // true = بدون cache
}, 1000);
