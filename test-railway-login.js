const https = require('https');

const loginData = {
  username: 'itomaranurag@gmail.com',
  password: 'Window$12'
};

const postData = JSON.stringify(loginData);

const options = {
  hostname: 'web-production-57dae.up.railway.app',
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};

console.log('🧪 Testing Railway login endpoint with username field...');
console.log('Sending:', JSON.stringify(loginData));
console.log('');

https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    try {
      const response = JSON.parse(data);
      console.log('Response:', JSON.stringify(response, null, 2));
    } catch (e) {
      console.log('Response:', data);
    }
  });
}).on('error', (e) => {
  console.error(`Error: ${e.message}`);
}).end(postData);
