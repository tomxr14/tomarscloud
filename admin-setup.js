const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Define schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function makeAdmin() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB!');
    
    // Get the first user or a specific one
    const email = process.argv[2];
    
    if (!email) {
      console.log('\n📋 Usage: node admin-setup.js <email>');
      console.log('   Example: node admin-setup.js anurag@gmail.com\n');
      
      // List all users
      const allUsers = await User.find({}, { email: 1, username: 1, isAdmin: 1 });
      console.log('📊 Current Users:');
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.username}) ${u.isAdmin ? '👑 ADMIN' : ''}`);
      });
      
      process.exit(0);
    }
    
    // Make user admin
    const user = await User.findOneAndUpdate(
      { email },
      { isAdmin: true },
      { new: true }
    );
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }
    
    console.log(`✅ ${user.email} is now an admin!`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Admin: ${user.isAdmin}\n`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

makeAdmin();
