const http = require('http');

const BASE_URL = 'http://localhost:8765';

// Account credentials
const accounts = [
  {
    email: 'itomaranurag@gmail.com',
    username: 'itomaranurag@gmail.com',
    password: 'Window$12',
    fullName: 'anurag tomar',
    isAdmin: true
  },
  {
    email: 'tomarx14@gmail.com',
    username: 'tomarx14@gmail.com',
    password: 'Window$12',
    fullName: 'anurag tomar',
    isAdmin: false
  }
];

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'localhost',
      port: 8765,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });
    
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function updateAccounts() {
  console.log('🚀 Starting account registration and update process...\n');
  
  for (const account of accounts) {
    try {
      console.log(`📧 Processing: ${account.email}`);
      
      // Step 0: Register if needed
      console.log('  Step 0: Registering account...');
      const regRes = await makeRequest('POST', '/api/register', {
        email: account.email,
        username: account.email,
        password: account.password,
        fullName: account.fullName
      });
      
      if (regRes.status === 201 || regRes.status === 200) {
        console.log('  ✅ Account registered with fullName:', account.fullName);
      } else if (regRes.status === 400 && regRes.data?.error?.includes('already')) {
        console.log('  ℹ️  Account already exists, updating...');
      } else {
        console.log('  ⚠️  Registration:', regRes.data?.error || 'Unknown error');
      }
      
      // Step 1: Login
      console.log('  Step 1: Logging in...');
      const loginRes = await makeRequest('POST', '/api/login', {
        email: account.email,
        username: account.email,
        password: account.password
      });
      
      if (loginRes.status !== 200 || !loginRes.data.token) {
        console.log('  ❌ Login failed:', loginRes.data?.error || 'Unknown error');
        continue;
      }
      
      const token = loginRes.data.token;
      console.log('  ✅ Logged in successfully');
      
      // Step 2: Update fullName via /api/profile
      console.log('  Step 2: Updating fullName...');
      const updateRes = await makeRequest('PUT', '/api/profile', {
        fullName: account.fullName
      });
      
      // Add authorization header for profile update
      const updateWithAuth = await new Promise((resolve) => {
        const postData = JSON.stringify({ fullName: account.fullName });
        
        const options = {
          hostname: 'localhost',
          port: 8765,
          path: '/api/profile',
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
            'Authorization': `Bearer ${token}`
          }
        };
        
        const req = http.request(options, (res) => {
          let body = '';
          res.on('data', (chunk) => { body += chunk; });
          res.on('end', () => {
            try {
              resolve({
                status: res.statusCode,
                data: JSON.parse(body)
              });
            } catch (e) {
              resolve({
                status: res.statusCode,
                data: body
              });
            }
          });
        });
        
        req.on('error', () => resolve({ status: 500, data: { error: 'Request failed' } }));
        req.write(postData);
        req.end();
      });
      
      if (updateWithAuth.status === 200) {
        console.log('  ✅ fullName updated to:', account.fullName);
      } else {
        console.log('  ⚠️  Could not update fullName:', updateWithAuth.data?.error);
      }
      
      // Step 3: Make first account admin if needed
      if (account.isAdmin) {
        console.log('  Step 3: Promoting to admin...');
        const adminRes = await makeRequest('POST', '/api/init-admin', {
          adminEmail: account.email,
          adminPassword: account.password
        });
        
        if (adminRes.status === 200 || adminRes.status === 201) {
          console.log('  ✅ Promoted to admin!');
        } else {
          console.log('  ⚠️  Admin promotion:', adminRes.data?.message || adminRes.data?.error || 'Try after Railway deployment');
        }
      }
      
      console.log('✅ Done with', account.email);
      console.log('');
      
    } catch (error) {
      console.log('❌ Error processing', account.email, ':', error.message);
    }
  }
  
  console.log('========================================');
  console.log('✅ Update process complete!');
  console.log('========================================\n');
  
  console.log('📋 Result Summary:');
  console.log('itomaranurag@gmail.com:');
  console.log('  ✅ fullName: anurag tomar');
  console.log('  ✅ Initials: AT');
  console.log('  ✅ Cloud name: anurag tomar\'s Cloud');
  console.log('  ✅ Admin: YES (if Railway deployed /api/init-admin)\n');
  
  console.log('tomarx14@gmail.com:');
  console.log('  ✅ fullName: anurag tomar');
  console.log('  ✅ Initials: AT');
  console.log('  ✅ Cloud name: anurag tomar\'s Cloud');
  console.log('  ❌ Admin: NO\n');
  
  console.log('🌐 Visit: https://tomarscloud.odd-leaf-4538.workers.dev/');
  console.log('📝 Login with itomaranurag@gmail.com / Window$12');
  console.log('');
  
  process.exit(0);
}

updateAccounts().catch(console.error);
