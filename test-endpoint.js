const https = require('https');

function testEndpoint(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response (first 500 chars):`);
        console.log(data.substring(0, 500));
        resolve();
      });
    }).on('error', (e) => {
      console.error(`Error: ${e.message}`);
      reject(e);
    });
  });
}

async function test() {
  console.log('Testing health endpoint...');
  await testEndpoint('https://web-production-57dae.up.railway.app/api/health');
  
  console.log('\n\nTesting login endpoint...');
  const postData = JSON.stringify({
    login: 'admin.anurag@tomarscloud.app',
    password: 'AdminAccess@2026'
  });
  
  const options = {
    hostname: 'web-production-57dae.up.railway.app',
    path: '/api/login',
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
      console.log(`Response: ${data.substring(0, 500)}`);
    });
  }).on('error', (e) => {
    console.error(`Error: ${e.message}`);
  }).end(postData);
}

test();
