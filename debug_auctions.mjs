// Debug script to inspect auction and product relationship
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function debug() {
  try {
    console.log('🔍 Debugging auction-product relationship\n');
    
    // Get products
    const productsRes = await fetch(`${BASE_URL}/api/products`);
    const products = await productsRes.json();
    
    console.log('📦 Products in database:');
    if (Array.isArray(products)) {
      console.log(`  Total: ${products.length}`);
      products.forEach(p => {
        console.log(`    - ID: ${p.id}, Name: ${p.name}, is_auction: ${p.is_auction}, auction_id: ${p.auction_id}`);
      });
    } else {
      console.log('  ERROR: Products is not an array');
      console.log('  Response:', products);
    }
    
    console.log('\n🎯 Expected Result:');
    console.log('  If you have 1 product with is_auction=true, there should be 1 auction');
    console.log('  The other 6 auctions are orphaned (no matching product_id)\n');
    
    console.log('✋ Next Step:');
    console.log('  The deletion might be blocked by a constraint or policy.');
    console.log('  Try running the following SQL directly in PostgreSQL:\n');
    console.log('  DELETE FROM auctions WHERE product_id NOT IN (SELECT id FROM products);\n');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

debug();
