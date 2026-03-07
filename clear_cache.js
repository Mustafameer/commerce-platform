// Clear old cart and reload page
if (typeof localStorage !== 'undefined') {
  localStorage.removeItem('cart-store');
  console.log('✅ Old cart cleared from localStorage');
  console.log('💾 Available products:');
  console.log('  - ID 14: علي الهادي - 35000 (37,500 IQD)');
  console.log('  - ID 16: علي الهادي - 35000 (40,000 IQD)');
  console.log('  - ID 12: علي الهادي - 50000 (57,500 IQD)');
  window.location.reload();
}
