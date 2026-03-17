#!/usr/bin/env node

/**
 * Frontend Simulation - Testing the company addition workflow
 * This simulates what the frontend does when adding a new company
 */

const BASE_URL = 'https://web-production-9efff.up.railway.app';

async function testAddCompany() {
  try {
    console.log('\n📋 TESTING COMPANY ADDITION WORKFLOW\n');
    console.log('='.repeat(70));

    // Step 1: Find available stores
    console.log('\n1️⃣  Finding available stores...');
    const storesRes = await fetch(`${BASE_URL}/api/stores?page=1&pageSize=100`);
    const stores = await storesRes.json();
    
    if (!Array.isArray(stores) || stores.length === 0) {
      console.log('   ❌ No stores found in database');
      return;
    }

    console.log(`   ✅ Found ${stores.length} store(s)`);
    stores.slice(0, 5).forEach(s => {
      console.log(`      • ID: ${s.id}, Name: ${s.store_name}, Type: ${s.store_type}`);
    });

    // Use first topup store or first store
    const topupStore = stores.find(s => s.store_type === 'topup');
    const selectedStore = topupStore || stores[0];
    console.log(`\n   📍 Selected store: ID ${selectedStore.id} (${selectedStore.store_name})`);

    // Step 2: Try to add a company
    console.log('\n2️⃣  Testing company addition...');
    const companyName = `Test Company ${Date.now()}`;
    
    const addRes = await fetch(`${BASE_URL}/api/topup/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store_id: selectedStore.id,
        name: companyName,
        logo_url: ''
      })
    });

    const addData = await addRes.json();
    
    if (addRes.ok) {
      console.log('   ✅ Company added successfully!');
      console.log(`      • ID: ${addData.id}`);
      console.log(`      • Name: ${addData.name}`);
      console.log(`      • Store ID: ${addData.store_id}`);
      
      // Clean up - delete the test company
      console.log('\n3️⃣  Cleaning up test data...');
      const deleteRes = await fetch(`${BASE_URL}/api/topup/companies/${addData.id}`, {
        method: 'DELETE'
      });
      
      if (deleteRes.ok) {
        console.log('   ✅ Test company deleted');
      }
    } else {
      console.log('   ❌ Failed to add company');
      console.log(`      Status: ${addRes.status}`);
      console.log(`      Error: ${addData.error || addData.details || JSON.stringify(addData)}`);
      
      if (addRes.status === 404) {
        console.log('\n   🔧 Suggestion: The store might not exist. This is expected if the topup store hasn\'t been created yet.');
      } else if (addRes.status === 500) {
        console.log('\n   🔧 Suggestion: Server error. Check if the database is properly initialized.');
      }
    }

    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
  }
}

// Run the test
testAddCompany();
