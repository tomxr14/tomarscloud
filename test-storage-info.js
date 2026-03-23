const http = require('http');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzE3NzQyNDA4NTk4ODAiLCJlbWFpbCI6InRlc3R1c2VyQGV4YW1wbGUuY29tIiwidXNlcm5hbWUiOiJ0ZXN0dXNlciIsImZ1bGxOYW1lIjoiSm9obiBTbWl0aCIsImlhdCI6MTc3NDI0MDg2OSwiZXhwIjoxNzc0ODQ1NjY5fQ.Lx1RKiF1Gq6L_f1voWhDGYdNDO5YQ2w23RJLqxoAepM';

const options = {
  hostname: 'localhost',
  port: 8765,
  path: '/api/storage-info',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

console.log('📊 Testing storage-info endpoint (used by Dashboard)...');
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
      console.log('\n📍 Dashboard will display:');
      console.log(`  User Name: "${response.fullName}"`);
      console.log(`  Cloud Name: "${response.fullName}'s Cloud"`);
      console.log(`  Initials: "${response.fullName.split(' ').map(w => w[0]).join('')}"`);
    } catch (e) {
      console.log(data);
    }
  });
}).on('error', (e) => {
  console.error(`❌ Error: ${e.message}`);
}).end();
