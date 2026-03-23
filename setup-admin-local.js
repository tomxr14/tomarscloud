#!/usr/bin/env node

const http = require('http');

const email = 'admin@tomarscloud.local';
const username = 'Admin';
const password = 'AdminPassword123';

// Step 1: Try to login first (user might already exist)
console.log('🔑 Attempting login...');
login();

function login() {
  const loginData = JSON.stringify({
    username: email,
    password: password
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 9000,
    path: '/api/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': loginData.length
    }
  };

  const loginReq = http.request(loginOptions, (loginRes) => {
    let body = '';
    
    loginRes.on('data', (chunk) => {
      body += chunk;
    });
    
    loginRes.on('end', () => {
      if (loginRes.statusCode === 200) {
        // Login success
        const response = JSON.parse(body);
        const token = response.token;
        const userId = response.user.id;
        
        console.log('✅ Login successful');
        makeAdmin(token, userId);
      } else {
        // Login failed, try registering
        console.log('⚠️  User not found, registering now...');
        register();
      }
    });
  });

  loginReq.on('error', (error) => {
    console.error('❌ Connection error:', error.message);
    console.error('Make sure the backend is running on localhost:8000');
    process.exit(1);
  });

  loginReq.write(loginData);
  loginReq.end();
}

function register() {
  const registerData = JSON.stringify({
    email: email,
    username: username,
    password: password
  });

  const registerOptions = {
    hostname: 'localhost',
    port: 9000,
    path: '/api/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': registerData.length
    }
  };

  const registerReq = http.request(registerOptions, (registerRes) => {
    let body = '';
    
    registerRes.on('data', (chunk) => {
      body += chunk;
    });
    
    registerRes.on('end', () => {
      if (registerRes.statusCode === 200) {
        const response = JSON.parse(body);
        console.log('✅ Registration successful');
        login(); // Now login
      } else {
        const response = JSON.parse(body);
        console.error('❌ Registration failed:', response.error);
        process.exit(1);
      }
    });
  });

  registerReq.on('error', (error) => {
    console.error('❌ Registration error:', error.message);
    process.exit(1);
  });

  registerReq.write(registerData);
  registerReq.end();
}

function makeAdmin(token, userId) {
  const adminData = JSON.stringify({ userId: userId });

  const adminOptions = {
    hostname: 'localhost',
    port: 9000,
    path: `/api/init-admin`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': adminData.length
    }
  };

  console.log(`\n👑 Promoting user to admin...`);

  const adminReq = http.request(adminOptions, (adminRes) => {
    let body = '';
    
    adminRes.on('data', (chunk) => {
      body += chunk;
    });
    
    adminRes.on('end', () => {
      if (adminRes.statusCode !== 200) {
        const response = JSON.parse(body);
        console.error(`❌ Admin promotion failed (${adminRes.statusCode}):`, response.error);
        process.exit(1);
      }
      
      const response = JSON.parse(body);
      console.log('✅ User promoted to admin!');
      console.log('\n🎉 Admin setup complete!');
      console.log('╔════════════════════════════════════════╗');
      console.log('║  📍 Visit: http://localhost:5173      ║');
      console.log(`║  📝 Email: ${email}                     ║`);
      console.log(`║  🔐 Password: ${password}          ║`);
      console.log('║  👑 You\'ll see Admin Panel in sidebar   ║');
      console.log('╚════════════════════════════════════════╝\n');
      process.exit(0);
    });
  });

  adminReq.on('error', (error) => {
    console.error('❌ Admin promotion error:', error.message);
    process.exit(1);
  });

  adminReq.write(adminData);
  adminReq.end();
}
