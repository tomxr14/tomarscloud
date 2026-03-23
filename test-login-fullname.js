const http = require('http');

const loginData = {
  username: 'testuser@example.com',
  password: 'TestPassword123'
};

const postData = JSON.stringify(loginData);

const options = {
  hostname: 'localhost',
  port: 8765,
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};

console.log('🔐 Testing login to retrieve fullName...');
console.log('');

http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`✅ Status: ${res.statusCode}`);
    console.log(`Response:`);
    try {
      const response = JSON.parse(data);
      console.log(JSON.stringify(response, null, 2));
      console.log('\n✨ User Info Retrieved:');
      console.log(`  Email: ${response.user.email}`);
      console.log(`  Username: ${response.user.username}`);
      console.log(`  Full Name: ${response.user.fullName}`);
      console.log(`  Has Token: ${!!response.token}`);
    } catch (e) {
      console.log(data);
    }
  });
}).on('error', (e) => {
  console.error(`❌ Error: ${e.message}`);
}).end(postData);
