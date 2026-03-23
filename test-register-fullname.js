const http = require('http');

const newUser = {
  email: 'testuser@example.com',
  username: 'testuser',
  password: 'TestPassword123',
  fullName: 'John Smith'
};

const postData = JSON.stringify(newUser);

const options = {
  hostname: 'localhost',
  port: 8765,
  path: '/api/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};

console.log('📝 Registering new user with fullName field...');
console.log(JSON.stringify(newUser, null, 2));
console.log('');

http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`✅ Status: ${res.statusCode}`);
    console.log(`Response:`);
    try {
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    } catch (e) {
      console.log(data);
    }
  });
}).on('error', (e) => {
  console.error(`❌ Error: ${e.message}`);
}).end(postData);
