const https = require('https');

const data = JSON.stringify({
  email: 'itomaranurag@gmail.com',
  username: 'itomaranurag@gmail.com',
  password: 'Window$12'
});

const options = {
  hostname: 'web-production-57dae.up.railway.app',
  port: 443,
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    try {
      const response = JSON.parse(body);
      console.log('========================================');
      console.log('Railway Backend Check');
      console.log('========================================\n');
      console.log('Status Code:', res.statusCode);
      
      if (response.user) {
        console.log('User Found:');
        console.log('  Email:', response.user.email);
        console.log('  Full Name:', response.user.fullName || '❌ NOT SET');
        console.log('  Is Admin:', response.user.isAdmin || false);
        console.log('');
        
        if (response.user.fullName) {
          console.log('✅ Railway HAS the new code with fullName!');
          console.log('');
          console.log('The website should now show:');
          console.log('  • AT (your initials)');
          console.log('  • anurag tomar\'s Cloud');
          console.log('  • Admin access if promoted');
        } else {
          console.log('❌ Railway still has OLD code (no fullName support)');
          console.log('');
          console.log('⏳ Waiting for Railway auto-deploy...');
          console.log('');
          console.log('What you can do:');
          console.log('1. Wait 5-10 more minutes for Railway to auto-deploy');
          console.log('2. Then reload: https://tomarscloud.odd-leaf-4538.workers.dev/');
          console.log('3. Login and you\'ll see AT + anurag tomar\'s Cloud');
        }
      } else {
        console.log('Error:', response.error);
      }
    } catch (e) {
      console.log('Error parsing response:', e.message);
      console.log('Body:', body);
    }
  });
});

req.on('error', (e) => {
  console.log('❌ Connection error:', e.message);
  console.log('');
  console.log('Railway might be down or not responding. Check:');
  console.log('https://status.railway.app');
});

req.write(data);
req.end();
