const bcrypt = require('bcrypt');

// Function to hash password
async function hashPassword(password) {
  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('✅ Password hashed successfully!');
    console.log('📝 Original password:', password);
    console.log('🔐 Hashed password:', hashedPassword);
    console.log('\n📋 Copy this hashed password to update your super admin account:');
    console.log('='.repeat(60));
    console.log(hashedPassword);
    console.log('='.repeat(60));
    return hashedPassword;
  } catch (error) {
    console.error('❌ Error hashing password:', error);
  }
}

// Get password from command line argument or use default
const password = process.argv[2] || 'admin123';

console.log('🔧 Generating hashed password...\n');
hashPassword(password); 