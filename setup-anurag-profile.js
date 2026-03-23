const http = require('http');

const email = 'itomaranurag@gmail.com';
const password = 'Window$12';
const username = 'itomaranurag';
const fullName = 'Anurag Tomar';

console.log('📍 UPDATING YOUR PROFILE\n');
console.log('Email: ' + email);
console.log('Desired Full Name: ' + fullName);
console.log('');

// Step 1: Register/Create user
console.log('🔐 Step 1: Registering account...\n');

const registerData = JSON.stringify({
  email: email,
  username: username,
  password: password,
  fullName: fullName  // Set fullName during registration
});

const registerOptions = {
  hostname: 'localhost',
  port: 8765,
  path: '/api/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': registerData.length
  }
};

http.request(registerOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.error) {
        console.log('⚠️  Account might already exist:', response.error);
        console.log('');
        console.log('Trying to login and update...\n');
        
        // Try login
        login();
      } else {
        console.log('✅ Account registered!');
        console.log('');
        
        showSuccess(response.user);
      }
      
    } catch (e) {
      console.error('Error:', e.message);
    }
  });
}).end(registerData);

function login() {
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
        console.log('✅ Logged in!');
        console.log('');
        
        // Step 2: Update profile
        console.log('📝 Step 2: Updating profile...\n');
        
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
                showSuccess(response2.user);
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
}

function showSuccess(user) {
  const initials = user.fullName.split(' ').map(w => w[0]).join('');
  const cloudName = user.fullName.split(' ')[0] + '\'s Cloud';
  
  console.log('✅ Profile updated successfully!');
  console.log('');
  console.log('📊 Your new profile:');
  console.log('  Full Name: ' + user.fullName);
  console.log('  Initials: ' + initials);
  console.log('  Cloud: ' + cloudName);
  console.log('');
  console.log('🎉 This will show on the website once you login!');
}
