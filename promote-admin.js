const http = require('http');

const email = process.argv[2] || 'ittomaranurag@gmail.com';

const data = JSON.stringify({});

const options = {
  hostname: 'localhost',
  port: 8000,
  path: `/api/admin/make-admin/ittomaranurag@gmail.com`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log('Response:', body);
    
    if(res.statusCode === 200) {
      console.log(`\n✅ ${email} is now an ADMIN!`);
      console.log('Login and check the sidebar for the 👑 Admin Panel button\n');
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.write(data);
req.end();
