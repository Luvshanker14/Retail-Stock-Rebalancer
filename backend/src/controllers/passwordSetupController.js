const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Verify password setup token
const verifySetupToken = async (req, res) => {
  const { token } = req.params;

  try {
    // Check if token exists and is valid
    const tokenResult = await pool.query(
      `SELECT pt.*, a.email, a.name 
       FROM password_setup_tokens pt 
       JOIN admins a ON pt.admin_id = a.id 
       WHERE pt.token = $1 AND pt.expires_at > NOW() AND pt.used_at IS NULL`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ 
        message: 'Invalid or expired setup link. Please contact support for a new link.' 
      });
    }

    const tokenData = tokenResult.rows[0];

    res.json({ 
      valid: true,
      admin: {
        email: tokenData.email,
        name: tokenData.name
      }
    });

  } catch (err) {
    console.error('Error verifying setup token:', err);
    res.status(500).json({ message: 'Error verifying setup link', error: err.message });
  }
};

// Set up password using token
const setupPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token and password are required' });
  }

  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  try {
    // Check if token exists and is valid
    const tokenResult = await pool.query(
      `SELECT pt.*, a.email, a.name 
       FROM password_setup_tokens pt 
       JOIN admins a ON pt.admin_id = a.id 
       WHERE pt.token = $1 AND pt.expires_at > NOW() AND pt.used_at IS NULL`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ 
        message: 'Invalid or expired setup link. Please contact support for a new link.' 
      });
    }

    const tokenData = tokenResult.rows[0];

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update admin password
    await pool.query(
      'UPDATE admins SET password = $1 WHERE id = $2',
      [hashedPassword, tokenData.admin_id]
    );

    // Mark token as used
    await pool.query(
      'UPDATE password_setup_tokens SET used_at = NOW() WHERE id = $1',
      [tokenData.id]
    );

    res.json({ 
      message: 'Password set up successfully! You can now login with your new password.',
      admin: {
        email: tokenData.email,
        name: tokenData.name
      }
    });

  } catch (err) {
    console.error('Error setting up password:', err);
    res.status(500).json({ message: 'Error setting up password', error: err.message });
  }
};

module.exports = {
  verifySetupToken,
  setupPassword
}; 