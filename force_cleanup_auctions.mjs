// Helper script for force cleanup
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function cleanup() {
  try {
    console.log('🔥 Orphaned Auction Force Cleanup\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Step 1: Inspect auctions table
    console.log('📊 Step 1: Inspecting auctions table...\n');
    const inspectRes = await fetch(`${BASE_URL}/api/admin/auctions/inspect`);
    const inspectData = await inspectRes.json();
    
    console.log('Auctions in database:');
    inspectData.auctions.forEach(a => {
      console.log(`  - ID: ${a.id}, Product ID: ${a.product_id}, Price: ${a.starting_price}`);
    });
    
    console.log(`\nProducts in database: ${inspectData.products.length}`);
    inspectData.products.forEach(p => {
      console.log(`  - ID: ${p.id}, Name: ${p.name}`);
    });
    
    console.log(`\n${inspectData.message}\n`);
    
    // Step 2: Run force cleanup
    console.log('🔥 Step 2: Running FORCE cleanup...\n');
    const cleanupRes = await fetch(`${BASE_URL}/api/admin/cleanup/auctions-force`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const cleanupData = await cleanupRes.json();
    
    if (!cleanupData.success) {
      console.error('❌ Cleanup failed:', cleanupData.error);
      return;
    }
    
    console.log(cleanupData.message);
    console.log('✅ All orphaned auction records removed!\n');
    
    // Step 3: Verify
    console.log('✅ Step 3: Verifying...\n');
    const verifyRes = await fetch(`${BASE_URL}/api/admin/auctions/inspect`);
    const verifyData = await verifyRes.json();
    
    console.log(`Remaining auctions: ${verifyData.auctions.length}`);
    if (verifyData.auctions.length === 0) {
      console.log('✅ Auctions table is now CLEAN!\n');
    }
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Cleanup Complete!');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

cleanup();
