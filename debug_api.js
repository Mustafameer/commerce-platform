// Check what the API actually returns
fetch('http://localhost:3000/api/products?storeId=1')
  .then(r => r.json())
  .then(products => {
    console.log('=== API RESPONSE ===');
    console.log('Total products:', products.length);
    const product95 = products.find((p: any) => p.id === 95);
    if (product95) {
      console.log('Product 95 found:', {
        id: product95.id,
        name: product95.name,
        store_id: product95.store_id,
        store_name: product95.store_name,
        category_name: product95.category_name,
        all_keys: Object.keys(product95)
      });
    } else {
      console.log('Product 95 NOT found');
      console.log('Available product IDs:', products.map((p: any) => p.id).slice(0, 10));
    }
  })
  .catch(e => console.error('Error:', e));
