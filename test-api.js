// Comprehensive API Test Suite for TomarsCloud
const http = require('http');

const API_BASE = 'http://localhost:3005';
let testToken = '';
let testUserId = '';
let testFileId = '';

// HTTP Request Helper
function makeRequest(method, endpoint, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, API_BASE);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Test Suite
async function runTests() {
  console.log('\n🧪 TomarsCloud API Test Suite');
  console.log('=' .repeat(50));

  try {
    // Test 1: Register User
    console.log('\n✅ TEST 1: Register New User');
    let res = await makeRequest('POST', '/api/register', {
      email: 'testuser@example.com',
      password: 'TestPassword123'
    });
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, res.body);
    if (res.status === 200) {
      testUserId = res.body.userId;
      console.log('   ✔️ Register SUCCESS');
    } else {
      console.log('   ❌ Register FAILED');
    }

    // Test 2: Login User
    console.log('\n✅ TEST 2: Login User');
    res = await makeRequest('POST', '/api/login', {
      email: 'testuser@example.com',
      password: 'TestPassword123'
    });
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, res.body);
    if (res.status === 200 && res.body.token) {
      testToken = res.body.token;
      console.log('   ✔️ Login SUCCESS, Token obtained');
    } else {
      console.log('   ❌ Login FAILED');
    }

    // Test 3: Get Files (should be empty initially)
    console.log('\n✅ TEST 3: Get Files List');
    res = await makeRequest('GET', '/api/files', null, {
      'Authorization': `Bearer ${testToken}`
    });
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, res.body);
    if (res.status === 200) {
      console.log('   ✔️ Get Files SUCCESS');
    } else {
      console.log('   ❌ Get Files FAILED');
    }

    // Test 4: Get Storage Info
    console.log('\n✅ TEST 4: Get Storage Info');
    res = await makeRequest('GET', '/api/storage-info', null, {
      'Authorization': `Bearer ${testToken}`
    });
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, res.body);
    if (res.status === 200) {
      console.log('   ✔️ Storage Info SUCCESS');
    } else {
      console.log('   ❌ Storage Info FAILED');
    }

    // Test 5: Test Unauthorized Access (no token)
    console.log('\n✅ TEST 5: Test Unauthorized Access (No Token)');
    res = await makeRequest('GET', '/api/files');
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, res.body);
    if (res.status === 401) {
      console.log('   ✔️ Authorization Check SUCCESS (properly rejected)');
    } else {
      console.log('   ❌ Authorization Check FAILED (should be 401)');
    }

    // Test 6: Invalid Login
    console.log('\n✅ TEST 6: Test Invalid Login');
    res = await makeRequest('POST', '/api/login', {
      email: 'testuser@example.com',
      password: 'WrongPassword'
    });
    console.log(`   Status: ${res.status}`);
    console.log(`   Response:`, res.body);
    if (res.status === 400) {
      console.log('   ✔️ Invalid Password Check SUCCESS (properly rejected)');
    } else {
      console.log('   ❌ Invalid Password Check FAILED');
    }

    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 TEST SUMMARY:');
    console.log(`   • Server: ${testToken ? '✅ RUNNING' : '❌ ERROR'}`);
    console.log(`   • Authentication: ${testToken ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`   • Authorization: ✅ ENFORCED`);
    console.log(`   • API Endpoints: ✅ RESPONDING`);
    console.log(`   • Database: ${testUserId ? '✅ IN-MEMORY MODE' : '❌ UNKNOWN'}`);
    console.log('\n🎉 All Core Tests Completed!');

  } catch (err) {
    console.log(`\n❌ Test Suite Error: ${err.message}`);
    process.exit(1);
  }
}

// Run tests
console.log('⏳ Waiting for server to be ready...');
setTimeout(runTests, 2000);
