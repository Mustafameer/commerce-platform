// Create a simple fix for image loading errors
// Add this to browser console to handle all broken images

(function() {
  // Handle all img errors
  document.addEventListener('error', function(event) {
    if (event.target.tagName === 'IMG') {
      console.warn('❌ Image failed to load:', event.target.src);
      // Replace with placeholder SVG
      event.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" font-size="14" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle" font-family="system-ui"%3E%D8%A7%D8%B6%D8%A7%D9%81%D8%A9 %D8%B5%D9%88%D8%B1%D8%A9%3C/text%3E%3Cpath d="M80 120 L100 100 L120 120" stroke="%239ca3af" stroke-width="2" fill="none"/%3E%3C/svg%3E';
      event.preventDefault();
    }
  }, true);
  console.log('✅ Image error handler installed');
})();
