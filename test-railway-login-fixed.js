const https = require('https');

// Test with both email and username fields (like the new frontend now sends)
const loginData = {
  email: 'itomaranurag@gmail.com',
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

console.log('✅ Testing Railway login with BOTH email and username fields...');
console.log('Sending:', JSON.stringify(loginData));
console.log('');

https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    try {
      const response = JSON.parse(data);
      if (response.error) {
        console.log('❌ Error:', response.error);
      } else {
        console.log('✅ Success! User logged in:');
        console.log('  Email:', response.user?.email);
        console.log('  Username:', response.user?.username);
        console.log('  Has Token:', !!response.token);
      }
    } catch (e) {
      console.log('Response:', data);
    }
  });
}).on('error', (e) => {
  console.error(`Error: ${e.message}`);
}).end(postData);
