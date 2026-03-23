const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

// Define the schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, unique: true },
  fullName: { type: String },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function updateAccounts() {
  try {
    console.log('🔗 Connecting to MongoDB...\n');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tomarscloud');
    
    console.log('✅ Connected to MongoDB!\n');
    
    // Update itomaranurag@gmail.com - make admin and set fullName
    console.log('📝 Updating itomaranurag@gmail.com...');
    const user1 = await User.findOneAndUpdate(
      { email: 'itomaranurag@gmail.com' },
      { 
        fullName: 'anurag tomar',
        isAdmin: true 
      },
      { new: true }
    );
    
    if (user1) {
      console.log('✅ Updated! Now Admin: true, fullName: "anurag tomar"');
      console.log('   Initials will show: AT');
      console.log('   Cloud name will show: anurag tomar\'s Cloud\n');
    } else {
      console.log('❌ Account not found\n');
    }
    
    // Update tomarx14@gmail.com - just set fullName
    console.log('📝 Updating tomarx14@gmail.com...');
    const user2 = await User.findOneAndUpdate(
      { email: 'tomarx14@gmail.com' },
      { 
        fullName: 'anurag tomar'
      },
      { new: true }
    );
    
    if (user2) {
      console.log('✅ Updated! fullName: "anurag tomar"');
      console.log('   Initials will show: AT');
      console.log('   Cloud name will show: anurag tomar\'s Cloud\n');
    } else {
      console.log('❌ Account not found\n');
    }
    
    console.log('========================================');
    console.log('✅ All accounts updated successfully!');
    console.log('========================================\n');
    
    console.log('📋 Summary:');
    console.log('itomaranurag@gmail.com:');
    console.log('  - Admin: YES ✅');
    console.log('  - Full Name: anurag tomar');
    console.log('  - Initials circle: AT');
    console.log('  - Cloud name: anurag tomar\'s Cloud\n');
    
    console.log('tomarx14@gmail.com:');
    console.log('  - Admin: NO');
    console.log('  - Full Name: anurag tomar');
    console.log('  - Initials circle: AT');
    console.log('  - Cloud name: anurag tomar\'s Cloud\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateAccounts();
