#!/usr/bin/env node
const https = require('https');

console.log('🔍 Testing Register Endpoint for Token...\n');

const postData = JSON.stringify({
  email: 'token-test-' + Date.now() + '@example.com',
  password: 'TestPassword123'
});

const options = {
  hostname: 'web-production-57dae.up.railway.app',
  port: 443,
  path: '/api/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`📊 Status Code: ${res.statusCode}`);
    console.log(`📦 Response Headers:`, res.headers);
    console.log(`📄 Response Body:`);
    
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
      
      if (parsed.token) {
        console.log('\n✅ SUCCESS: Token is present in response!');
        console.log(`   Token: ${parsed.token.substring(0, 50)}...`);
        console.log('\n🚀 Railway backend has been successfully deployed with token fix!');
      } else {
        console.log('\n❌ PROBLEM: No token in response');
        console.log('   Railway backend may not have deployed the latest code yet');
        console.log('   Typical wait time: 1-2 minutes from GitHub push');
      }
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request Error: ${e.message}`);
});

req.write(postData);
req.end();
