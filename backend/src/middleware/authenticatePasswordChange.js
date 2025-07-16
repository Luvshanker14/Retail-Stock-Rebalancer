const jwt = require('jsonwebtoken');

// Middleware for password change with current password
const authenticatePasswordChange = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Try to decode as different user types
    let decoded;
    let userType;

    // Try super admin token first
    try {
      decoded = jwt.verify(token, process.env.SUPER_ADMIN_SECRET || 'super-admin-secret-key');
      if (decoded.role === 'super_admin') {
        userType = 'super_admin';
      }
    } catch (err) {
      // Not a super admin token, try regular tokens
    }

    // Try regular admin token
    if (!userType) {
      try {
        decoded = jwt.verify(token, 'your-secret-key');
        // Check if it's an admin by looking for admin-specific fields
        if (decoded.email) {
          // We need to check the database to determine if it's admin or customer
          // For now, we'll set a flag and check in the controller
          userType = 'admin_or_customer';
        }
      } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
      }
    }

    if (!decoded) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // Set user info in request
    req.userId = decoded.id;
    req.userEmail = decoded.email;
    req.userType = userType;
    req.decodedToken = decoded;

    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to determine exact user type (admin or customer)
const determineUserType = async (req, res, next) => {
  if (req.userType !== 'admin_or_customer') {
    return next();
  }

  try {
    const pool = require('../config/db');
    
    // Check if it's an admin
    const adminResult = await pool.query(
      'SELECT id FROM admins WHERE id = $1 AND email = $2',
      [req.userId, req.userEmail]
    );

    if (adminResult.rows.length > 0) {
      req.userType = 'admin';
    } else {
      // Check if it's a customer
      const customerResult = await pool.query(
        'SELECT id FROM customers WHERE id = $1 AND email = $2',
        [req.userId, req.userEmail]
      );

      if (customerResult.rows.length > 0) {
        req.userType = 'customer';
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    next();
  } catch (err) {
    console.error('Error determining user type:', err);
    res.status(500).json({ message: 'Error determining user type', error: err.message });
  }
};

module.exports = {
  authenticatePasswordChange,
  determineUserType
}; 