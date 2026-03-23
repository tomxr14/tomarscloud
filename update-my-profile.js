const http = require('http');

const email = 'itomaranurag@gmail.com';
const password = 'Window$12';
const fullName = 'Anurag Tomar';

// Step 1: Login
console.log('🔐 Step 1: Logging in...\n');

const loginData = JSON.stringify({
  email: email,
  username: email,
  password: password
});

const loginOptions = {
  hostname: 'localhost',
  port: 8765,
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

http.request(loginOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (!response.token) {
        console.log('❌ Login failed:', response);
        process.exit(1);
      }
      
      const token = response.token;
      console.log('✅ Logged in successfully!');
      console.log('');
      
      // Step 2: Update profile with fullName
      console.log('📝 Step 2: Updating profile with fullName "Anurag Tomar"...\n');
      
      const profileData = JSON.stringify({ fullName });
      
      const profileOptions = {
        hostname: 'localhost',
        port: 8765,
        path: '/api/profile',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': profileData.length,
          'Authorization': `Bearer ${token}`
        }
      };
      
      http.request(profileOptions, (res2) => {
        let data2 = '';
        res2.on('data', (chunk) => { data2 += chunk; });
        res2.on('end', () => {
          try {
            const response2 = JSON.parse(data2);
            if (response2.error) {
              console.log('❌ Update failed:', response2.error);
            } else {
              console.log('✅ Profile updated successfully!');
              console.log('');
              console.log('📊 Your new profile:');
              console.log('  Full Name: ' + response2.user.fullName);
              console.log('  Initials: ' + response2.user.fullName.split(' ').map(w => w[0]).join(''));
              console.log('  Cloud: ' + response2.user.fullName.split(' ')[0] + '\'s Cloud');
              console.log('');
              console.log('🎉 Reload the website to see your changes!');
            }
          } catch (e) {
            console.log(data2);
          }
        });
      }).end(profileData);
      
    } catch (e) {
      console.error('Error:', e.message);
    }
  });
}).end(loginData);
