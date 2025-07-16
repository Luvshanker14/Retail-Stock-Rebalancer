const jwt = require('jsonwebtoken');

function authenticateCustomer(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key'); // 🔐 Use env var in real projects
    req.customer = { id: decoded.id, email: decoded.email }; // ✅ Use req.customer, not req.admin
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

module.exports = authenticateCustomer;