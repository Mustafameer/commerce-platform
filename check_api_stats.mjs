import fetch from 'node-fetch';

try {
  console.log('📡 Checking /api/admin/stats endpoint...\n');
  
  const response = await fetch('http://localhost:5000/api/admin/stats');
  const stats = await response.json();
  
  console.log('✅ API Response:');
  console.log(JSON.stringify(stats, null, 2));
  
  console.log('\n📊 Analysis:');
  console.log(`   Total Stores (from API): ${stats.totalStores}`);
  console.log(`   Total Orders: ${stats.totalOrders}`);
  console.log(`   Total Users: ${stats.totalUsers}`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
