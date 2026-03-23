#!/usr/bin/env node
const https = require('https');

const tests = [
  '/assets/index-CkTVr-R7.js',
  '/assets/index-C7VuEHkE.css',
];

let completed = 0;

function testAsset(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'tomarscloud.odd-leaf-4538.workers.dev',
      path: path,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk.toString().substring(0, 100);
      });

      res.on('end', () => {
        const status = res.statusCode;
        const size = res.headers['content-length'] || data.length;
        console.log(`${status === 200 ? '✅' : '❌'} ${path}`);
        console.log(`   Status: ${status}, Size: ${size} bytes`);
        console.log(`   Content-Type: ${res.headers['content-type']}`);
        console.log();
        
        completed++;
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log(`❌ ${path}`);
      console.log(`   Error: ${e.message}\n`);
      completed++;
      resolve();
    });

    req.end();
  });
}

console.log('🔍 Testing individual assets:\n');
Promise.all(tests.map(testAsset)).then(() => {
  console.log('='.repeat(50));
  console.log('If both show ✅ with proper sizes, app should work');
});
