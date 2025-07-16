const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, 'your-secret-key'); // 🔐 Replace with env secret
    // Check admin status in DB
    const result = await pool.query('SELECT id, email, status FROM admins WHERE id = $1', [decoded.id]);
    if (result.rows.length === 0 || result.rows[0].status !== 'active') {
      return res.status(403).json({ message: 'Admin account is inactive or does not exist' });
    }
    req.admin = { id: result.rows[0].id, email: result.rows[0].email };
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authenticateAdmin;


