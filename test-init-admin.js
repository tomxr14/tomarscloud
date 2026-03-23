const https = require('https');

const postData = JSON.stringify({
  userId: 'user_1774239976805'
});

const options = {
  hostname: 'web-production-57dae.up.railway.app',
  path: '/api/init-admin',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};

https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response:`);
    console.log(data);
  });
}).on('error', (e) => {
  console.error(`Error: ${e.message}`);
}).end(postData);
