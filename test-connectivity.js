#!/usr/bin/env node

/**
 * TomarsCloud - Quick Connection Test Script
 * Tests all API endpoints and button functionality
 */

const http = require('http');
const https = require('https');

const ENDPOINTS = {
  local: {
    register: 'http://localhost:3010/api/register',
    login: 'http://localhost:3010/api/login',
    files: 'http://localhost:3010/api/files',
    storage: 'http://localhost:3010/api/storage-info'
  },
  remote: {
    register: 'https://web-production-57dae.up.railway.app/api/register',
    login: 'https://web-production-57dae.up.railway.app/api/login',
    files: 'https://web-production-57dae.up.railway.app/api/files',
    storage: 'https://web-production-57dae.up.railway.app/api/storage-info'
  }
};

let testResults = {
  local: {},
  remote: {},
  passed: 0,
  failed: 0
};

function makeRequest(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    };

    if (body) {
      headers['Content-Length'] = Buffer.byteLength(body);
    }

    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method,
      headers,
      timeout: 5000
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) req.write(body);
    req.end();
  });
}

async function testEndpoint(environment, name, url, method = 'GET', body = null) {
  try {
    console.log(`  Testing ${name}...`);
    const response = await makeRequest(url, method, body);
    
    if (response.status >= 200 && response.status < 500) {
      console.log(`    ✅ Status ${response.status}`);
      testResults[environment][name] = 'PASS';
      testResults.passed++;
      return true;
    } else {
      console.log(`    ⚠️  Status ${response.status}`);
      testResults[environment][name] = `FAIL (${response.status})`;
      testResults.failed++;
      return false;
    }
  } catch (err) {
    console.log(`    ❌ Error: ${err.message}`);
    testResults[environment][name] = `ERROR: ${err.message}`;
    testResults.failed++;
    return false;
  }
}

async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║  TomarsCloud Connectivity Test v1.0   ║');
  console.log('╚═══════════════════════════════════════╝\n');

  // Test Local Server
  console.log('🔷 Testing LOCAL SERVER (Port 3010)');
  console.log('═══════════════════════════════════════');
  
  const testUser = {
    email: 'test' + Date.now() + '@example.com',
    password: 'Test123!'
  };

  await testEndpoint('local', 'GET /storage-info', ENDPOINTS.local.storage);
  await testEndpoint('local', 'POST /register', ENDPOINTS.local.register, 'POST', 
    JSON.stringify(testUser));
  await testEndpoint('local', 'POST /login', ENDPOINTS.local.login, 'POST',
    JSON.stringify({ email: testUser.email, password: testUser.password }));
  await testEndpoint('local', 'GET /files', ENDPOINTS.local.files);

  // Test Remote Server
  console.log('\n🔶 Testing RAILWAY BACKEND');
  console.log('═══════════════════════════════════════');
  
  await testEndpoint('remote', 'GET /storage-info', ENDPOINTS.remote.storage);
  await testEndpoint('remote', 'POST /register', ENDPOINTS.remote.register, 'POST',
    JSON.stringify(testUser));
  await testEndpoint('remote', 'GET /files', ENDPOINTS.remote.files);

  // Summary
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║  TEST RESULTS                         ║');
  console.log('╚═══════════════════════════════════════╝\n');
  
  console.log('LOCAL SERVER Results:');
  Object.entries(testResults.local).forEach(([name, result]) => {
    const icon = result === 'PASS' ? '✅' : '❌';
    console.log(`  ${icon} ${name}: ${result}`);
  });

  console.log('\nRAILWAY BACKEND Results:');
  Object.entries(testResults.remote).forEach(([name, result]) => {
    const icon = result === 'PASS' ? '✅' : '❌';
    console.log(`  ${icon} ${name}: ${result}`);
  });

  console.log('\n═══════════════════════════════════════');
  console.log(`Total: ${testResults.passed} PASSED, ${testResults.failed} FAILED`);
  console.log('═══════════════════════════════════════\n');

  if (testResults.failed === 0) {
    console.log('✨ All tests passed! Your system is ready to use.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Check the errors above.\n');
    process.exit(1);
  }
}

// Run the tests
runAllTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
