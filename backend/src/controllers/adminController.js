const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendOTP } = require('../services/mailService');
const redisClient = require('../services/redisService');

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const sendSignupOTP = async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    // Check if email already exists
    const existing = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP in Redis with 10 minutes expiration
    const otpKey = `admin_signup_otp:${email}`;
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

const verifySignupOTP = async (req, res) => {
  const { email, otp } = req.body;
  
  try {
    // Get OTP data from Redis
    const otpKey = `admin_signup_otp:${email}`;
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

    // Hash password and create admin
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO admins (name, email, password) VALUES ($1, $2, $3)',
      [name, email, hashedPassword]
    );

    // Delete OTP from Redis
    await redisClient.del(otpKey);

    // Generate JWT token
    const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    const admin = result.rows[0];
    const token = jwt.sign({ id: admin.id, email: admin.email }, 'your-secret-key', {
      expiresIn: '1d'
    });

    res.status(201).json({ 
      message: 'Admin registered successfully',
      token 
    });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ message: 'Error during signup verification', error: err.message });
  }
};

const signupAdmin = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO admins (name, email, password) VALUES ($1, $2, $3)',
      [name, email, hashedPassword]
    );
    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error during signup', error: err.message });
  }
};

const loginAdmin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const admin = result.rows[0];
    if (admin.status !== 'active') {
      return res.status(403).json({ message: 'Admin account is inactive. Please contact support.' });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin.id, email: admin.email }, 'your-secret-key', {
      expiresIn: '1d'
    });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Login error', error: err.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const adminId = req.admin.id;

    // 1. Get last payout timestamp for this admin
    const lastPayoutResult = await pool.query(
      'SELECT paid_at FROM payouts WHERE admin_id = $1 ORDER BY paid_at DESC LIMIT 1',
      [adminId]
    );
    const lastPayout = lastPayoutResult.rows[0]?.paid_at || '1970-01-01';

    // 2. Total Tracked Stores
    const trackedStoresResult = await pool.query(
      'SELECT COUNT(*) FROM admin_store_links WHERE admin_id = $1',
      [adminId]
    );
    const totalTrackedStores = parseInt(trackedStoresResult.rows[0].count);

    // 3. Total Stock Items
    const stockItemsResult = await pool.query(
      'SELECT COALESCE(SUM(quantity), 0) FROM stocks WHERE admin_id = $1',
      [adminId]
    );
    const totalStockItems = parseInt(stockItemsResult.rows[0].coalesce || stockItemsResult.rows[0].sum || 0);

    // 4. Stock Alerts (real value)
    const stockAlertsResult = await pool.query(
      'SELECT COUNT(*) FROM stocks WHERE admin_id = $1 AND quantity < 10',
      [adminId]
    );
    const stockAlerts = parseInt(stockAlertsResult.rows[0].count);

    // 5. Total Purchases (number of items sold since last payout)
    const purchasesResult = await pool.query(
      `SELECT COALESCE(SUM(cp.quantity), 0) AS total_items
       FROM customer_purchases cp
       JOIN stocks s ON cp.stock_id = s.id
       WHERE s.admin_id = $1 AND cp.purchase_date > $2`,
      [adminId, lastPayout]
    );
    const totalPurchases = parseInt(purchasesResult.rows[0].total_items);

    // 6. Total Revenue (sum of total_amount since last payout)
    const revenueResult = await pool.query(
      `SELECT COALESCE(SUM(cp.total_amount), 0) AS total_revenue
       FROM customer_purchases cp
       JOIN stocks s ON cp.stock_id = s.id
       WHERE s.admin_id = $1 AND cp.purchase_date > $2`,
      [adminId, lastPayout]
    );
    const totalRevenue = parseFloat(revenueResult.rows[0].total_revenue);

    // 7. Earnings After Commission (since last payout)
    // Get admin's active subscription plan_id
    const subResult = await pool.query(
      `SELECT plan_id FROM admin_subscriptions WHERE admin_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
      [adminId]
    );
    let commissionRate = 0.15; // default to 15%
    if (subResult.rows.length > 0) {
      const planId = subResult.rows[0].plan_id;
      if (planId === 2) commissionRate = 0.10;
      else if (planId === 3) commissionRate = 0.05;
    }
    const earningsAfterCommission = totalRevenue * (1 - commissionRate);

    res.json({
      totalTrackedStores,
      totalStockItems,
      totalPurchases,
      totalRevenue,
      earningsAfterCommission,
      stockAlerts
    });
  } catch (err) {
    console.error('Error in getDashboardStats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// New metrics endpoints for dashboard
const getMetricsData = async (req, res) => {
  try {
    const { type } = req.params;
    
    switch (type) {
      case 'purchases':
        // Get total purchases from Prometheus metrics
        const purchasesData = {
          total: 0, // This would be fetched from Prometheus in production
          recent: []
        };
        res.json(purchasesData);
        break;
        
      case 'revenue':
        // Get total revenue from Prometheus metrics
        const revenueData = {
          total: 0, // This would be fetched from Prometheus in production
          recent: []
        };
        res.json(revenueData);
        break;
        
      case 'alerts':
        // Get stock alerts data
        const alertsData = {
          lowStock: 0,
          outOfStock: 0
        };
        res.json(alertsData);
        break;
        
      default:
        res.status(400).json({ error: 'Invalid metrics type' });
    }
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const adminId = req.admin.id;

  try {
    // Get current admin
    const adminResult = await pool.query(
      'SELECT * FROM admins WHERE id = $1',
      [adminId]
    );

    if (adminResult.rows.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const admin = adminResult.rows[0];

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE admins SET password = $1 WHERE id = $2',
      [hashedNewPassword, adminId]
    );

    res.json({ message: 'Password changed successfully' });

  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Failed to change password', error: err.message });
  }
};

// Get all low-stock items for the current admin
const getLowStockDetails = async (req, res) => {
  try {
    const adminId = req.admin.id;
    const result = await pool.query(
      `SELECT s.id AS stock_id, s.name AS product_name, s.quantity, st.id AS store_id, st.name AS store_name
       FROM stocks s
       JOIN stores st ON s.store_id = st.id
       WHERE s.admin_id = $1 AND s.quantity < 10
       ORDER BY s.quantity ASC`,
      [adminId]
    );
    res.json({ lowStockItems: result.rows });
  } catch (err) {
    console.error('Error fetching low stock details:', err);
    res.status(500).json({ error: 'Failed to fetch low stock details' });
  }
};

// POST /admin/rebalance-stock
const rebalanceStock = async (req, res) => {
  try {
    const adminId = req.admin.id;
    const { stock_id, store_id, quantityToAdd } = req.body;
    if (!stock_id || !store_id || !quantityToAdd || quantityToAdd <= 0) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    // Fetch the stock and check admin ownership
    const stockResult = await pool.query(
      'SELECT * FROM stocks WHERE id = $1 AND store_id = $2',
      [stock_id, store_id]
    );
    const stock = stockResult.rows[0];
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    if (stock.admin_id !== adminId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Calculate minimum quantity to add
    const minToAdd = 11 - stock.quantity;
    if (quantityToAdd < minToAdd) {
      return res.status(400).json({ error: `Quantity to add must be at least ${minToAdd}` });
    }

    // Update the stock quantity
    const newQty = stock.quantity + quantityToAdd;
    await pool.query(
      'UPDATE stocks SET quantity = $1, updated_at = NOW() WHERE id = $2',
      [newQty, stock_id]
    );

    // Get admin email
    const adminResult = await pool.query('SELECT email, name FROM admins WHERE id = $1', [adminId]);
    const adminEmail = adminResult.rows[0]?.email;
    const adminName = adminResult.rows[0]?.name || 'Admin';

    // Get store name
    const storeResult = await pool.query('SELECT name FROM stores WHERE id = $1', [store_id]);
    const storeName = storeResult.rows[0]?.name || `Store-${store_id}`;

    // Send confirmation email
    if (adminEmail) {
      await sendOTP(adminEmail, 'Stock Rebalanced Successfully', `<p>Hi ${adminName},</p>
          <p>Your stock for <b>${stock.name}</b> in <b>${storeName}</b> has been rebalanced.</p>
          <p>Previous quantity: ${stock.quantity}<br/>Added: ${quantityToAdd}<br/>New quantity: ${newQty}</p>
          <p>Thank you!</p>`);
    }

    res.json({
      message: 'Stock rebalanced successfully',
      stock_id,
      store_id,
      new_quantity: newQty
    });
  } catch (err) {
    console.error('Error in rebalanceStock:', err);
    res.status(500).json({ error: 'Failed to rebalance stock' });
  }
};

// GET /admin/recent-activity
const getRecentActivities = async (req, res) => {
  try {
    // Get admin email from auth middleware
    const adminEmail = req.admin.email;
    if (!adminEmail) {
      return res.status(400).json({ error: 'Admin email not found' });
    }
    const result = await pool.query(
      `SELECT kl.id, kl.topic, kl.event_type, kl.store_id, st.name AS store_name, kl.stock_id, kl.admin_email, kl.payload, kl.timestamp
       FROM kafka_logs kl
       LEFT JOIN stores st ON kl.store_id = st.id
       WHERE kl.admin_email = $1
       ORDER BY kl.id DESC
       LIMIT 20`,
      [adminEmail]
    );
    // Parse payload and add stock_name from payload if present
    const activities = result.rows.map(row => {
      let stock_name = null;
      let payload = row.payload;
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload);
        } catch {}
      }
      if (payload && typeof payload === 'object' && payload.name) {
        stock_name = payload.name;
      }
      return { ...row, stock_name };
    });
    res.json({ activities });
  } catch (err) {
    console.error('Error fetching recent activities:', err);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
};

// GET /admin/top-stores
const getTopStores = async (req, res) => {
  try {
    const adminId = req.admin.id;
    const result = await pool.query(
      `SELECT st.id AS store_id, st.name AS store_name, COALESCE(SUM(cp.total_amount), 0) AS revenue
       FROM customer_purchases cp
       JOIN stocks s ON cp.stock_id = s.id
       JOIN stores st ON s.store_id = st.id
       WHERE s.admin_id = $1
       GROUP BY st.id, st.name
       ORDER BY revenue DESC
       LIMIT 5`,
      [adminId]
    );
    res.json({ topStores: result.rows });
  } catch (err) {
    console.error('Error fetching top stores:', err);
    res.status(500).json({ error: 'Failed to fetch top stores' });
  }
};

// Admin requests subscription cancellation
const requestCancellation = async (req, res) => {
  const adminId = req.admin.id;
  try {
    // Check if a pending request already exists
    const existing = await pool.query(
      'SELECT * FROM admin_cancellation_requests WHERE admin_id = $1 AND status = $2',
      [adminId, 'pending']
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Cancellation request already pending.' });
    }
    // Insert new cancellation request
    await pool.query(
      'INSERT INTO admin_cancellation_requests (admin_id, status) VALUES ($1, $2)',
      [adminId, 'pending']
    );
    res.json({ message: 'Cancellation request submitted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit cancellation request', error: err.message });
  }
};

// Create Change Plan Request (Admin)
const createChangePlanRequest = async (req, res) => {
  try {
    const adminId = req.admin.id;
    const { newPlanId } = req.body;
    if (!newPlanId) {
      return res.status(400).json({ message: 'New plan ID is required' });
    }
    // Get current active subscription
    const subResult = await pool.query(
      'SELECT plan_id FROM admin_subscriptions WHERE admin_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
      [adminId, 'active']
    );
    if (subResult.rows.length === 0) {
      return res.status(400).json({ message: 'No active subscription found' });
    }
    const oldPlanId = subResult.rows[0].plan_id;
    if (oldPlanId === newPlanId) {
      return res.status(400).json({ message: 'You are already on this plan' });
    }
    // Insert change plan request
    await pool.query(
      `INSERT INTO admin_change_plan_requests (admin_id, old_plan_id, new_plan_id, status) VALUES ($1, $2, $3, 'pending')`,
      [adminId, oldPlanId, newPlanId]
    );
    res.json({ message: 'Change plan request submitted. Please wait for super admin approval.' });
  } catch (err) {
    console.error('Create change plan request error:', err);
    res.status(500).json({ message: 'Failed to create change plan request', error: err.message });
  }
};

// Get admin profile with subscription details
const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.admin.id;
    const pool = require('../config/db');

    // 1. Get admin basic info
    const adminResult = await pool.query(
      'SELECT id, name, email, created_at, status FROM admins WHERE id = $1',
      [adminId]
    );
    if (adminResult.rows.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    const admin = adminResult.rows[0];

    // 2. Get latest (active or most recent) subscription
    const subResult = await pool.query(
      `SELECT * FROM admin_subscriptions WHERE admin_id = $1 ORDER BY status = 'active' DESC, created_at DESC LIMIT 1`,
      [adminId]
    );
    let subscription = null;
    if (subResult.rows.length > 0) {
      subscription = subResult.rows[0];
      // 3. Get plan details
      const planResult = await pool.query(
        'SELECT id, name, price, duration_days, features FROM subscription_plans WHERE id = $1',
        [subscription.plan_id]
      );
      subscription.plan = planResult.rows[0] || null;
    }

    res.json({
      ...admin,
      subscription
    });
  } catch (err) {
    console.error('Error fetching admin profile:', err);
    res.status(500).json({ message: 'Error fetching admin profile', error: err.message });
  }
};

// Get all active subscription plans (for admin)
const getSubscriptionPlans = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Get subscription plans error:', err);
    res.status(500).json({ message: 'Failed to fetch subscription plans', error: err.message });
  }
};

module.exports = { 
  signupAdmin,
  sendSignupOTP,
  verifySignupOTP,
  loginAdmin,
  getDashboardStats,
  getMetricsData,
  changePassword,
  getLowStockDetails,
  rebalanceStock,
  getRecentActivities,
  getTopStores,
  requestCancellation,
  createChangePlanRequest,
  getAdminProfile,
  getSubscriptionPlans
};
