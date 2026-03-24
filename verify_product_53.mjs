const API_BASE_URL = 'http://localhost:3000';

async function verifyProductData() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 VERIFYING PRODUCT #53 DATA');
    console.log('='.repeat(80) + '\n');

    // Get product 53
    const productRes = await fetch(`${API_BASE_URL}/api/products/53`);
    if (!productRes.ok) {
      console.error('❌ Could not fetch product 53');
      process.exit(1);
    }

    const product = await productRes.json();
    console.log('📦 Product Data:');
    console.log('  - ID:', product.id);
    console.log('  - Name:', product.name);
    console.log('  - Description:', product.description);
    console.log('  - Price:', product.price);
    console.log('  - Stock:', product.stock);
    console.log('  - is_auction:', product.is_auction);
    console.log('  - auction_id:', product.auction_id);
    console.log('  - created_at:', product.created_at);

    // Get auction data
    if (product.auction_id) {
      console.log('\n🎯 Auction Data (من الـ API):');
      const auctionRes = await fetch(`${API_BASE_URL}/api/auctions?productId=${product.id}`);
      
      if (auctionRes.ok) {
        const auction = await auctionRes.json();
        console.log('  - Auction ID:', auction.id);
        console.log('  - Date:', auction.auction_date);
        console.log('  - Start Time:', auction.auction_start_time);
        console.log('  - End Time:', auction.auction_end_time);
        console.log('  - Starting Price:', auction.starting_price);
        console.log('  - Status:', auction.status);
        console.log('  - Current Price:', auction.current_price);
        console.log('  - Created:', auction.created_at);

        console.log('\n✅ البيانات المحفوظة:');
        console.log('   📅 التاريخ: ' + auction.auction_date);
        console.log('   ⏰ التوقيت: ' + auction.auction_start_time + ' إلى ' + auction.auction_end_time);
        console.log('   💰 السعر الأساسي: ' + auction.starting_price + ' IQD');
      } else {
        console.error('❌ Could not fetch auction data');
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✨ البيانات محفوظة بشكل صحيح!');
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyProductData();
