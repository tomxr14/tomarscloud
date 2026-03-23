#!/usr/bin/env node
const https = require('https');

console.log('🔍 Checking what the frontend is actually serving...\n');

const tests = [
  { path: '/', name: 'Root /' },
  { path: '/index.html', name: 'Direct index.html' },
  { path: '/assets/index-C7VuEHkE.css', name: 'CSS asset' },
  { path: '/assets/index-CkTVr-R7.js', name: 'JS asset' },
];

let completed = 0;

function runTest(test) {
  return new Promise((resolve) => {
    const url = new URL('https://tomarscloud.odd-leaf-4538.workers.dev' + test.path);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Node.js'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk.toString().substring(0, 200); // Just first 200 chars
      });

      res.on('end', () => {
        const status = res.statusCode;
        const contentType = res.headers['content-type'];
        console.log(`${status === 200 ? '✅' : '❌'} ${test.name}`);
        console.log(`   Status: ${status}`);
        console.log(`   Content-Type: ${contentType}`);
        if (data.length > 0) {
          console.log(`   First 100 chars: ${data.substring(0, 100)}`);
          if (data.includes('<!DOCTYPE') || data.includes('<html')) {
            console.log(`   ✓ HTML detected`);
          }
        }
        console.log();
        
        completed++;
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log(`❌ ${test.name}`);
      console.log(`   Error: ${e.message}\n`);
      completed++;
      resolve();
    });

    req.end();
  });
}

Promise.all(tests.map(runTest)).then(() => {
  console.log('='.repeat(50));
  console.log('If you see HTML content above, the app is deployed correctly');
  console.log('If you see "Not found", the assets may not be in KV storage');
});
