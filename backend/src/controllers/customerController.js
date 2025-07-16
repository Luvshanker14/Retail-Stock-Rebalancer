const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendOTP } = require('../services/mailService');
const redisClient = require('../services/redisService');

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.sendSignupOTP = async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    // Check if email already exists
    const existing = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP in Redis with 10 minutes expiration
    const otpKey = `signup_otp:${email}`;
    await redisClient.setEx(otpKey, 600, JSON.stringify({
      otp,
      name,
      password,
      timestamp: Date.now()
    }));

    // Send OTP email
    await sendOTP(email, otp, name);
    
    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).json({ message: 'Error sending OTP', error: err.message });
  }
};

exports.verifySignupOTP = async (req, res) => {
  const { email, otp } = req.body;
  
  try {
    // Get OTP data from Redis
    const otpKey = `signup_otp:${email}`;
    const otpData = await redisClient.get(otpKey);
    
    if (!otpData) {
      return res.status(400).json({ message: 'OTP expired or not found' });
    }

    const { otp: storedOTP, name, password, timestamp } = JSON.parse(otpData);
    
    // Check if OTP is expired (10 minutes)
    if (Date.now() - timestamp > 600000) {
      await redisClient.del(otpKey);
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Verify OTP
    if (otp !== storedOTP) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO customers (name, email, password) VALUES ($1, $2, $3)',
      [name, email, hashedPassword]
    );

    // Delete OTP from Redis
    await redisClient.del(otpKey);

    // Generate JWT token
    const result = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
    const customer = result.rows[0];
    const token = jwt.sign({ id: customer.id, email: customer.email }, 'your-secret-key', {
      expiresIn: '1d'
    });

    res.status(201).json({ 
      message: 'Customer registered successfully',
      token 
    });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ message: 'Error during signup verification', error: err.message });
  }
};

exports.signupCustomer = async (req, res) => {
  const { name, email, password} = req.body;
  try {
    const existing = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO customers (name, email, password) VALUES ($1, $2, $3)',
      [name, email, hashedPassword]
    );
    res.status(201).json({ message: 'Customer registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error during signup', error: err.message });
  }
};

exports.loginCustomer = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const customer = result.rows[0];
    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: customer.id, email: customer.email }, 'your-secret-key', {
      expiresIn: '1d'
    });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Login error', error: err.message });
  }
};

// Get current customer profile
exports.getProfile = async (req, res) => {
  const customerId = req.customer?.id;
  if (!customerId) {
    return res.status(401).json({ message: 'Customer authentication required' });
  }
  try {
    const result = await pool.query('SELECT id, name, email FROM customers WHERE id = $1', [customerId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    const customer = result.rows[0];
    res.json(customer);
  } catch (err) {
    console.error('Error fetching customer profile:', err);
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
};

// Get purchase history for the authenticated customer
exports.getPurchaseHistory = async (req, res) => {
  const customerId = req.customer?.id;
  if (!customerId) {
    return res.status(401).json({ message: 'Customer authentication required' });
  }
  try {
    const result = await pool.query(
      'SELECT * FROM customer_purchases WHERE customer_id = $1 ORDER BY purchase_date DESC',
      [customerId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching purchase history:', err);
    res.status(500).json({ message: 'Error fetching purchase history', error: err.message });
  }
};