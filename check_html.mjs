import { createServer } from 'http';

const url = 'http://localhost:3000/admin/stores';

fetch(url)
  .then(r => r.text())
  .then(html => {
    console.log('HTML check:');
    console.log('- Length:', html.length);
    console.log('- Contains "login":', html.toLowerCase().includes('login'));
    console.log('- Contains "password":', html.toLowerCase().includes('password'));
    console.log('- Contains "إدارة":', html.includes('إدارة'));
    console.log('- Contains "root":', html.includes('id="root"'));
    
    // Get first 1000 chars
    console.log('\nFirst 1000 chars of body:');
    const bodyStart = html.indexOf('<body>');
    if (bodyStart >= 0) {
      console.log(html.substring(bodyStart, bodyStart + 1000));
    }
  })
  .catch(err => console.error('Error:', err.message));
