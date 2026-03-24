#!/usr/bin/env node

// Helper script to cleanup orphaned auction records via API
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function cleanup() {
  try {
    console.log('🧹 Orphaned Auction Cleanup Tool\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Step 1: Check current status
    console.log('📊 Step 1: Checking current status...\n');
    const statusRes = await fetch(`${BASE_URL}/api/admin/cleanup/status`);
    const status = await statusRes.json();
    
    if (!status.success) {
      console.error('❌ Failed to check status:', status.error);
      return;
    }
    
    console.log('Current Status:');
    console.log(`  Total Auctions: ${status.status.totalAuctions}`);
    console.log(`  Valid Auctions: ${status.status.validAuctions}`);
    console.log(`  Orphaned Auctions: ${status.status.orphanedAuctions}`);
    console.log(`  Is Clean: ${status.status.isClean ? '✅ Yes' : '❌ No'}\n`);
    
    console.log('Constraint Status:');
    console.log(`  CASCADE DELETE exists: ${status.constraint.exists ? '✅ Yes' : '❌ No'}\n`);
    
    // If no orphaned records and constraint exists, we're done
    if (status.status.isClean && status.constraint.exists) {
      console.log('✅ Database is already clean and protected!');
      return;
    }
    
    // Step 2: Run cleanup if needed
    if (!status.status.isClean) {
      console.log('🧹 Step 2: Removing orphaned records...\n');
      const cleanupRes = await fetch(`${BASE_URL}/api/admin/cleanup/orphaned-auctions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const cleanup = await cleanupRes.json();
      
      if (!cleanup.success) {
        console.error('❌ Cleanup failed:', cleanup.error);
        return;
      }
      
      console.log('Cleanup Results:');
      console.log(`  Orphaned Found: ${cleanup.cleanup.orphanedFound}`);
      console.log(`  Deleted: ${cleanup.cleanup.deleted}`);
      console.log(`  Final Count: ${cleanup.cleanup.finalAuctionCount}\n`);
      
      console.log('Constraint Status:');
      console.log(`  Status: ${cleanup.constraint.status}`);
      console.log(`  Message: ${cleanup.constraint.message}\n`);
    }
    
    // Step 3: Final verification
    console.log('✅ Step 3: Final verification...\n');
    const finalRes = await fetch(`${BASE_URL}/api/admin/cleanup/status`);
    const final = await finalRes.json();
    
    console.log('Final Status:');
    console.log(`  Total Auctions: ${final.status.totalAuctions}`);
    console.log(`  Valid Auctions: ${final.status.validAuctions}`);
    console.log(`  Orphaned Auctions: ${final.status.orphanedAuctions}`);
    console.log(`  Is Clean: ${final.status.isClean ? '✅ Yes' : '❌ No'}`);
    console.log(`  CASCADE DELETE: ${final.constraint.exists ? '✅ Enabled' : '❌ Disabled'}\n`);
    
    console.log('═══════════════════════════════════════════════════════════');
    if (final.status.isClean && final.constraint.exists) {
      console.log('✅ SUCCESS! Database is clean and protected.');
      console.log('Future product deletions will automatically remove associated auctions.');
    } else {
      console.log('⚠️ Some issues remain. Check the output above.');
    }
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

cleanup();
