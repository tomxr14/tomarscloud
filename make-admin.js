const http = require('http');

function makeRequest(method, path, data) {
  return new Promise((resolve) => {
    const postData = data ? JSON.stringify(data) : null;
    const opts = {
      hostname: 'localhost',
      port: 8765,
      path: path,
      method: method,
      headers: { 
        'Content-Type': 'application/json',
        'Content-Length': postData ? Buffer.byteLength(postData) : 0
      }
    };
    
    const request = http.request(opts, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        resolve({ 
          code: res.statusCode, 
          data: body ? JSON.parse(body) : null 
        });
      });
    });
    
    if (postData) request.write(postData);
    request.end();
  });
}

(async () => {
  console.log('🚀 Promoting itomaranurag@gmail.com to admin...\n');
  
  try {
    const login = await makeRequest('POST', '/api/login', { 
      email: 'itomaranurag@gmail.com', 
      username: 'itomaranurag@gmail.com', 
      password: 'Window$12'
    });
    
    if (login.code !== 200 || !login.data?.user?.id) {
      console.log('❌ Login failed');
      console.log('Response:', login.data);
      process.exit(1);
    }
    
    const userId = login.data.user.id;
    console.log('✅ Logged in');
    console.log('   User ID:', userId);
    console.log('   Full Name:', login.data.user.fullName);
    console.log('');
    
    const admin = await makeRequest('POST', '/api/init-admin', { userId: userId });
    
    if (admin.code === 200) {
      console.log('✅ Successfully promoted to admin!');
      console.log('');
      console.log('👑 Admin Account Details:');
      console.log('   Email:', admin.data.user.email);
      console.log('   Full Name:', admin.data.user.fullName);
      console.log('   Initials: AT');
      console.log('   Cloud Name: anurag tomar\'s Cloud');
      console.log('   Admin Status: YES ✅');
      console.log('');
      console.log('========================================');
      console.log('🎉 All set! You can now:');
      console.log('========================================');
      console.log('');
      console.log('1. Visit: https://tomarscloud.odd-leaf-4538.workers.dev/');
      console.log('2. Login with: itomaranurag@gmail.com / Window$12');
      console.log('3. You will see the 👑 Admin button in the sidebar');
      console.log('4. The profile will show "AT" initials and "anurag tomar\'s Cloud"');
      console.log('');
    } else if (admin.code === 403) {
      console.log('⚠️  Admin already exists');
      console.log('Response:', admin.data?.error);
    } else {
      console.log('❌ Failed to promote');
      console.log('Status:', admin.code);
      console.log('Response:', admin.data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
})();
