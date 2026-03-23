#!/usr/bin/env node

const https = require('https');

const email = 'admin.anurag@tomarscloud.app';
const username = 'Anurag (Admin)';
const password = 'AdminAccess@2026';

console.log('📝 Creating admin account...');
console.log(`   Email: ${email}`);
console.log(`   Username: ${username}\n`);

const registerData = JSON.stringify({
  email: email,
  username: username,
  password: password
});

const registerOptions = {
  hostname: 'web-production-57dae.up.railway.app',
  path: '/api/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': registerData.length
  }
};

const registerReq = https.request(registerOptions, (registerRes) => {
  let body = '';
  
  registerRes.on('data', (chunk) => {
    body += chunk;
  });
  
  registerRes.on('end', () => {
    if (registerRes.statusCode === 200 || registerRes.statusCode === 400) {
      const response = JSON.parse(body);
      if (registerRes.statusCode === 400) {
        console.log('⚠️  Account might already exist');
      } else {
        console.log('✅ Account created successfully');
      }
    }
    
    // Now login
    console.log('\n🔑 Logging in...');
    login();
  });
});

registerReq.on('error', (error) => {
  console.error('❌ Registration error:', error.message);
  process.exit(1);
});

registerReq.write(registerData);
registerReq.end();

function login() {
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
        const response = JSON.parse(body);
        console.error('❌ Login failed:', response.error);
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
}

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
      console.log('\n🎉 Admin account ready!');
      console.log('╔═══════════════════════════════════════════════════════╗');
      console.log('║  📍 Site: https://tomarscloud.odd-leaf-4538.workers.dev ║');
      console.log(`║  📧 Email: ${email}                 ║`);
      console.log(`║  🔐 Password: ${password}                   ║`);
      console.log('║  👑 Login and access Admin Panel from sidebar          ║');
      console.log('╚═══════════════════════════════════════════════════════╝\n');
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
