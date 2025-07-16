const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authenticateSuperAdmin = async (req, res, next) => {
  try {
    // Check if super admin features are enabled
    // In development, require explicit enable flag
    // In production, super admin is always available
    if (process.env.NODE_ENV === 'development' && !process.env.SUPER_ADMIN_ENABLED) {
      return res.status(403).json({ error: 'Super admin access not available in development mode. Set SUPER_ADMIN_ENABLED=true to enable.' });
    }

    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.SUPER_ADMIN_SECRET || 'super-admin-secret-key');

    // Check if token is for super admin
    if (decoded.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Super admin role required.' });
    }

    // Get super admin from database
    const result = await pool.query(
      'SELECT id, name, email, is_active FROM super_admins WHERE id = $1 AND is_active = true',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Super admin not found or inactive' });
    }

    // Add super admin info to request
    req.superAdmin = result.rows[0];
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    console.error('Super admin authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

module.exports = authenticateSuperAdmin; 