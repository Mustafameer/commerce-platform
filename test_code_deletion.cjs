const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:123@localhost:5432/multi_ecommerce'
});

async function testCodeDeletion() {
  try {
    console.log('\n📋 TOPUP CODE DELETION TEST\n');

    // 1. Find a topup product with codes
    console.log('1️⃣  Finding topup product with codes...');
    const productResult = await pool.query(`
      SELECT id, store_id, company_id, array_length(codes, 1) as code_count, codes
      FROM topup_products 
      WHERE codes IS NOT NULL AND array_length(codes, 1) > 0
      LIMIT 1
    `);

    if (productResult.rows.length === 0) {
      console.log('❌ No topup products with codes found');
      await pool.end();
      return;
    }

    const product = productResult.rows[0];
    console.log(`✓ Found product ID: ${product.id}`);
    console.log(`  Store ID: ${product.store_id}`);
    console.log(`  Company ID: ${product.company_id}`);
    console.log(`  Current codes count: ${product.code_count}`);
    console.log(`  First 3 codes: ${JSON.stringify(product.codes.slice(0, 3))}`);

    // 2. Create a test order for this product
    console.log(`\n2️⃣  Creating test order...`);
    
    // Find a topup store
    const storeResult = await pool.query(`
      SELECT id FROM stores WHERE id = 13 LIMIT 1
    `);
    
    if (storeResult.rows.length === 0) {
      console.log('❌ Store 13 not found');
      await pool.end();
      return;
    }

    const storeId = storeResult.rows[0].id;

    // Create order
    const orderResult = await pool.query(`
      INSERT INTO orders (store_id, phone, total_amount, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [storeId, '0789123456', 5000, 'completed']);

    const orderId = orderResult.rows[0].id;
    console.log(`✓ Created order ID: ${orderId}`);

    // 3. Create order item with topup product
    console.log(`\n3️⃣  Creating order item...`);
    
    // Get 2 codes for the order
    const codesToDeliver = product.codes.slice(0, 2);
    
    const itemResult = await pool.query(`
      INSERT INTO order_items (order_id, topup_product_id, quantity, price, topup_codes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [orderId, product.id, 2, 5000, codesToDeliver]);

    console.log(`✓ Created order item`);
    console.log(`  Codes to be deleted: ${JSON.stringify(codesToDeliver)}`);

    // 4. Check product codes before purchase
    console.log(`\n4️⃣  Checking product codes BEFORE deletion...`);
    const beforeResult = await pool.query(`
      SELECT array_length(codes, 1) as code_count, codes
      FROM topup_products 
      WHERE id = $1
    `, [product.id]);

    const beforeCount = beforeResult.rows[0].code_count;
    console.log(`  Codes count: ${beforeCount}`);
    console.log(`  First 3: ${JSON.stringify(beforeResult.rows[0].codes.slice(0, 3))}`);

    // 5. Simulate the deletion (this is what the server does)
    console.log(`\n5️⃣  Simulating code deletion (like the server does)...`);
    
    const codesArray = beforeResult.rows[0].codes;
    const quantity = 2;
    const remainingCodes = codesArray.slice(quantity);
    
    console.log(`  Original array length: ${codesArray.length}`);
    console.log(`  Quantity to delete: ${quantity}`);
    console.log(`  Remaining codes length: ${remainingCodes.length}`);
    console.log(`  Remaining first 3: ${JSON.stringify(remainingCodes.slice(0, 3))}`);

    // 6. Execute the update like the server does
    console.log(`\n6️⃣  Executing UPDATE query...`);
    
    const updateResult = await pool.query(
      `UPDATE topup_products SET codes = $1 WHERE id = $2 RETURNING codes, array_length(codes, 1) as code_count`,
      [remainingCodes, product.id]
    );

    console.log(`✓ Update executed`);
    const updatedCount = updateResult.rows[0].code_count;
    console.log(`  Updated codes count: ${updatedCount}`);
    console.log(`  Updated first 3: ${JSON.stringify(updateResult.rows[0].codes.slice(0, Math.min(3, updatedCount)))}`);

    // 7. Verify with fresh SELECT
    console.log(`\n7️⃣  Verifying with fresh SELECT...`);
    const verifyResult = await pool.query(`
      SELECT array_length(codes, 1) as code_count, codes
      FROM topup_products 
      WHERE id = $1
    `, [product.id]);

    const finalCount = verifyResult.rows[0].code_count;
    console.log(`  Final codes count: ${finalCount}`);
    console.log(`  Expected count: ${beforeCount - quantity}`);
    
    if (finalCount === beforeCount - quantity) {
      console.log(`\n✅ SUCCESS! Codes were deleted correctly!`);
    } else {
      console.log(`\n❌ FAILURE! Expected ${beforeCount - quantity} codes but got ${finalCount}`);
    }

    // Cleanup
    console.log(`\n8️⃣  Cleaning up test data...`);
    await pool.query(`DELETE FROM order_items WHERE order_id = $1`, [orderId]);
    await pool.query(`DELETE FROM orders WHERE id = $1`, [orderId]);
    console.log('✓ Cleanup complete');

    await pool.end();
  } catch (e) {
    console.error('❌ Error:', e.message);
    console.error('Stack:', e.stack);
    await pool.end();
  }
}

testCodeDeletion();
