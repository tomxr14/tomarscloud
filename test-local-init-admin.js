const http = require('http');

const postData = JSON.stringify({
  userId: 'user_1774239976805'
});

const options = {
  hostname: 'localhost',
  port: 8001,
  path: '/api/init-admin',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};

http.request(options, (res) => {
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
