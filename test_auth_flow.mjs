// Simulate browser opened to /admin/stores
// First, check if user is logged in by trying to access the auth endpoint

const checkAuthentication = async () => {
  console.log('🔐 Checking Authentication...\n');
  
  // Get auth status from server (if such endpoint exists)
  try {
    const res = await fetch('http://localhost:3000/api/me');
    if (res.ok) {
      const user = await res.json();
      console.log('✓ User is logged in:');
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Role: ${user.role}`);
      console.log(`\n✓ Should be able to see admin dashboard`);
      return true;
    } else if (res.status === 401) {
      console.log('❌ User is NOT logged in (401 Unauthorized)');
      console.log('   Need to redirect to /login');
      return false;
    }
  } catch (err) {
    console.log('⚠️  No /api/me endpoint, checking localStorage...');
  }
  
  // Try checking localStorage (if frontend uses it)
  console.log('\n🔍 Checking expected localStorage keys:');
  const commonKeys = ['token', 'user', 'auth', 'session'];
  commonKeys.forEach(key => {
    console.log(`  - localStorage.${key}: (would need browser to check)`);
  });
  
  console.log('\n💡 Solution: Need to ensure user is logged in');
  console.log('   1. Check browser DevTools > Application > LocalStorage');
  console.log('   2. Or try to login first at http://localhost:3000/login');
};

checkAuthentication();
