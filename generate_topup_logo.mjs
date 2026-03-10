// SVG شعار بسيط لمتجر الشحن
const topupStoreLogo = `data:image/svg+xml;base64,${Buffer.from(`
<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Red Circle Background -->
  <circle cx="100" cy="100" r="95" fill="#D63333" stroke="#8B0000" stroke-width="2"/>
  
  <!-- White Circle -->
  <circle cx="100" cy="100" r="85" fill="white"/>
  
  <!-- Arabic Text for "Card" -->
  <text x="100" y="110" font-size="48" font-weight="bold" text-anchor="middle" fill="#D63333" font-family="Arial, sans-serif">💳</text>
  
  <!-- Credit Card Icon Lines -->
  <rect x="40" y="130" width="120" height="40" rx="3" fill="none" stroke="#D63333" stroke-width="2"/>
  <rect x="40" y="140" width="120" height="8" fill="#D63333" opacity="0.3"/>
</svg>
`).toString('base64')}`;

console.log('✅ شعار SVG قيد الإنشاء');
console.log(topupStoreLogo.substring(0, 100) + '...');

export default topupStoreLogo;
