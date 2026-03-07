const http = require('http');

const data = JSON.stringify({password: '123456'});

const opts = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/set-password/5',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(opts, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log(JSON.stringify(JSON.parse(body), null, 2));
  });
});

req.on('error', (e) => console.error('Error:', e));
req.write(data);
req.end();
