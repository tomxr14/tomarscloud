#!/usr/bin/env node
const https = require('https');

const url = 'https://tomarscloud.odd-leaf-4538.workers.dev/';

const options = {
  hostname: 'tomarscloud.odd-leaf-4538.workers.dev',
  path: '/',
  method: 'GET'
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Content-Type: ${res.headers['content-type']}`);
    console.log(`Content length: ${data.length}`);
    console.log('\nFirst 300 characters:');
    console.log(data.substring(0, 300));
    
    if (data.includes('<!DOCTYPE') || data.includes('<html')) {
      console.log('\n✅ HTML page is loading!');
    } else if (data.includes('Not found')) {
      console.log('\n❌ Getting "Not found" error');
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.end();
