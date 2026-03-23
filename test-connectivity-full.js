#!/usr/bin/env node
const https = require('https');
const http = require('http');

const tests = [
  {
    name: 'Backend /api/health',
    url: 'https://web-production-57dae.up.railway.app/api/health',
    method: 'GET'
  },
  {
    name: 'Backend /api/register (OPTIONS for CORS)',
    url: 'https://web-production-57dae.up.railway.app/api/register',
    method: 'OPTIONS'
  },
  {
    name: 'Backend /api/register (POST)',
    url: 'https://web-production-57dae.up.railway.app/api/register',
    method: 'POST',
    body: JSON.stringify({
      email: 'test-' + Date.now() + '@example.com',
      password: 'TestPass123'
    })
  },
  {
    name: 'Frontend page load',
    url: 'https://tomarscloud.odd-leaf-4538.workers.dev/',
    method: 'GET'
  }
];

let completed = 0;

function runTest(test) {
  return new Promise((resolve) => {
    const protocol = test.url.startsWith('https') ? https : http;
    const url = new URL(test.url);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: test.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = protocol.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const status = res.statusCode >= 200 && res.statusCode < 300 ? '✅' : '❌';
        console.log(`${status} ${test.name}`);
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   CORS enabled: ${res.headers['access-control-allow-origin'] ? '✅ Yes' : '❌ No'}`);
        
        if (test.method === 'POST' && data) {
          try {
            const parsed = JSON.parse(data);
            console.log(`   Has token: ${parsed.token ? '✅ Yes' : '❌ No'}`);
          } catch (e) {}
        }
        
        completed++;
        resolve();
      });
    });

    req.on('error', (e) => {
      console.log(`❌ ${test.name}`);
      console.log(`   Error: ${e.message}`);
      completed++;
      resolve();
    });

    if (test.body) {
      req.write(test.body);
    }
    req.end();
  });
}

console.log('🔍 Tomarscloud Connectivity Test\n');
console.log('Testing: Frontend ↔ Backend Connection\n');

Promise.all(tests.map(runTest)).then(() => {
  console.log('\n' + '='.repeat(50));
  console.log('Frontend URL: https://tomarscloud.odd-leaf-4538.workers.dev');
  console.log('Backend URL:  https://web-production-57dae.up.railway.app/api');
  console.log('='.repeat(50));
});
