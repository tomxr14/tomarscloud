#!/usr/bin/env node

const https = require('https');

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node promote-admin.js <email> <password>');
  console.log('Example: node promote-admin.js ittomaranurag@gmail.com YourPassword123\n');
  process.exit(1);
}

console.log('🔑 Logging in...');

const loginData = JSON.stringify({
  email: email,
  username: email,
  password: password
});

const loginOptions = {
  hostname: 'web-production-57dae.up.railway.app',
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

const loginReq = https.request(loginOptions, (loginRes) => {
  let body = '';
  
  loginRes.on('data', (chunk) => {
    body += chunk;
  });
  
  loginRes.on('end', () => {
    if (loginRes.statusCode !== 200) {
      console.error('❌ Login failed:', body);
      process.exit(1);
    }
    
    const response = JSON.parse(body);
    const userId = response.user.id;
    
    console.log('✅ Login successful');
    console.log(`📋 User ID: ${userId}\n`);
    
    promoteToAdmin(userId);
  });
});

loginReq.on('error', (error) => {
  console.error('❌ Connection error:', error.message);
  process.exit(1);
});

loginReq.write(loginData);
loginReq.end();

function promoteToAdmin(userId) {
  const adminData = JSON.stringify({ userId: userId });

  const adminOptions = {
    hostname: 'web-production-57dae.up.railway.app',
    path: '/api/init-admin',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': adminData.length
    }
  };

  console.log('👑 Promoting to admin...');

  const adminReq = https.request(adminOptions, (adminRes) => {
    let body = '';
    
    adminRes.on('data', (chunk) => {
      body += chunk;
    });
    
    adminRes.on('end', () => {
      if (adminRes.statusCode !== 200) {
        const response = JSON.parse(body);
        console.error(`❌ Promotion failed (${adminRes.statusCode}):`, response.error);
        process.exit(1);
      }
      
      console.log('✅ Successfully promoted to admin!');
      console.log('\n🎉 Admin Panel is now available!');
      console.log('📍 Refresh: https://tomarscloud.odd-leaf-4538.workers.dev/');
      console.log('👑 Look for the "Admin Panel" button in the sidebar\n');
      process.exit(0);
    });
  });

  adminReq.on('error', (error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });

  adminReq.write(adminData);
  adminReq.end();
}
