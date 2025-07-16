const pool = require('../config/db');
const bcrypt = require('bcrypt');
const { sendOTP } = require('../services/mailService');
const redisClient = require('../services/redisService');

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send password change OTP
const sendPasswordChangeOTP = async (req, res) => {
  const { email, userType } = req.body;
  
  if (!email || !userType) {
    return res.status(400).json({ message: 'Email and user type are required' });
  }

  if (!['customer', 'admin', 'super_admin'].includes(userType)) {
    return res.status(400).json({ message: 'Invalid user type' });
  }

  try {
    // Check if user exists
    let userTable, userField;
    switch (userType) {
      case 'customer':
        userTable = 'customers';
        userField = 'email';
        break;
      case 'admin':
        userTable = 'admins';
        userField = 'email';
        break;
      case 'super_admin':
        userTable = 'super_admins';
        userField = 'email';
        break;
    }

    const result = await pool.query(
      `SELECT * FROM ${userTable} WHERE ${userField} = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP in Redis with 10 minutes expiration
    const otpKey = `password_change_otp:${userType}:${email}`;
    await redisClient.setEx(otpKey, 600, JSON.stringify({
      otp,
      userType,
      userId: user.id,
      timestamp: Date.now()
    }));

    // Send OTP email
    await sendOTP(email, otp, user.name || user.email);
    
    res.json({ message: 'Password change OTP sent successfully' });
  } catch (err) {
    console.error('Error sending password change OTP:', err);
    res.status(500).json({ message: 'Error sending OTP', error: err.message });
  }
};

// Verify password change OTP and change password
const changePasswordWithOTP = async (req, res) => {
  const { email, userType, otp, newPassword } = req.body;
  
  if (!email || !userType || !otp || !newPassword) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  if (!['customer', 'admin', 'super_admin'].includes(userType)) {
    return res.status(400).json({ message: 'Invalid user type' });
  }

  // Validate password strength
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  try {
    // Get OTP data from Redis
    const otpKey = `password_change_otp:${userType}:${email}`;
    const otpData = await redisClient.get(otpKey);
    
    if (!otpData) {
      return res.status(400).json({ message: 'OTP expired or not found' });
    }

    const { otp: storedOTP, userType: storedUserType, userId, timestamp } = JSON.parse(otpData);
    
    // Check if OTP is expired (10 minutes)
    if (Date.now() - timestamp > 600000) {
      await redisClient.del(otpKey);
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Verify OTP
    if (otp !== storedOTP) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    let userTable, passwordField;
    switch (userType) {
      case 'customer':
        userTable = 'customers';
        passwordField = 'password';
        break;
      case 'admin':
        userTable = 'admins';
        passwordField = 'password';
        break;
      case 'super_admin':
        userTable = 'super_admins';
        passwordField = 'password_hash';
        break;
    }

    await pool.query(
      `UPDATE ${userTable} SET ${passwordField} = $1 WHERE id = $2`,
      [hashedPassword, userId]
    );

    // Delete OTP from Redis
    await redisClient.del(otpKey);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ message: 'Error changing password', error: err.message });
  }
};

// Change password with current password (for authenticated users)
const changePasswordWithCurrent = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userType = req.userType; // Set by middleware
  const userId = req.userId; // Set by middleware
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }

  // Validate password strength
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  try {
    // Get user from database
    let userTable, passwordField, idField;
    switch (userType) {
      case 'customer':
        userTable = 'customers';
        passwordField = 'password';
        idField = 'id';
        break;
      case 'admin':
        userTable = 'admins';
        passwordField = 'password';
        idField = 'id';
        break;
      case 'super_admin':
        userTable = 'super_admins';
        passwordField = 'password_hash';
        idField = 'id';
        break;
    }

    const result = await pool.query(
      `SELECT * FROM ${userTable} WHERE ${idField} = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user[passwordField]);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      `UPDATE ${userTable} SET ${passwordField} = $1 WHERE ${idField} = $2`,
      [hashedPassword, userId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ message: 'Error changing password', error: err.message });
  }
};

module.exports = {
  sendPasswordChangeOTP,
  changePasswordWithOTP,
  changePasswordWithCurrent
}; 