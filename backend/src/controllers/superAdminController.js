const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendOTP, sendApprovalEmail, sendRejectionEmail } = require('../services/mailService');
const redisClient = require('../services/redisService');

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Super Admin Authentication
const loginSuperAdmin = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Check if super admin features are enabled
    // In development, require explicit enable flag
    // In production, super admin is always available
    if (process.env.NODE_ENV === 'development' && !process.env.SUPER_ADMIN_ENABLED) {
      return res.status(403).json({ message: 'Super admin access not available in development mode. Set SUPER_ADMIN_ENABLED=true to enable.' });
    }

    // Get super admin from database
    const result = await pool.query(
      'SELECT * FROM super_admins WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const superAdmin = result.rows[0];

    // Check if account is locked
    if (superAdmin.locked_until && new Date() < superAdmin.locked_until) {
      return res.status(423).json({ 
        message: 'Account is locked. Please try again later.' 
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, superAdmin.password_hash);
    if (!isMatch) {
      // Increment failed attempts
      await pool.query(
        'UPDATE super_admins SET failed_attempts = failed_attempts + 1 WHERE id = $1',
        [superAdmin.id]
      );

      // Lock account after 5 failed attempts
      if (superAdmin.failed_attempts >= 4) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        await pool.query(
          'UPDATE super_admins SET locked_until = $1 WHERE id = $1',
          [lockUntil, superAdmin.id]
        );
        return res.status(423).json({ 
          message: 'Account locked due to multiple failed attempts. Try again in 30 minutes.' 
        });
      }

      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Reset failed attempts on successful login
    await pool.query(
      'UPDATE super_admins SET failed_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = $1',
      [superAdmin.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: superAdmin.id, 
        email: superAdmin.email, 
        role: 'super_admin' 
      }, 
      process.env.SUPER_ADMIN_SECRET || 'super-admin-secret-key',
      { expiresIn: '1h' }
    );

    // Log the login action
    await pool.query(
      'INSERT INTO super_admin_logs (super_admin_id, action, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
      [
        superAdmin.id,
        'LOGIN',
        { email: superAdmin.email },
        req.ip,
        req.headers['user-agent']
      ]
    );

    res.json({ 
      message: 'Login successful',
      token,
      superAdmin: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email
      }
    });

  } catch (err) {
    console.error('Super admin login error:', err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

// Get Super Admin Dashboard Stats
const getDashboardStats = async (req, res) => {
  try {
    const superAdminId = req.superAdmin.id;

    // Get current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const monthStart = `${currentMonth}-01`;
    const nextMonth = new Date(new Date(monthStart).setMonth(new Date(monthStart).getMonth() + 1));
    const monthEnd = nextMonth.toISOString().slice(0, 10);

    // Calculate actual revenue from active subscriptions (current month)
    const actualRevenueResult = await pool.query(
      `SELECT COALESCE(SUM(monthly_fee), 0) as total_revenue
       FROM admin_subscriptions
       WHERE status = 'active' AND to_char(payment_date, 'YYYY-MM') = $1`,
      [currentMonth]
    );

    // Calculate total revenue from all active subscriptions (all time)
    const totalRevenueResult = await pool.query(
      `SELECT COALESCE(SUM(monthly_fee), 0) as total_revenue
       FROM admin_subscriptions
       WHERE status = 'active'`
    );

    // Get active subscriptions (count)
    const activeSubscriptionsResult = await pool.query(
      `SELECT COUNT(*) as active_count FROM admin_subscriptions WHERE status = 'active'`
    );

    // Get pending admin requests
    const pendingRequestsResult = await pool.query(
      'SELECT COUNT(*) as pending_count FROM admin_requests WHERE status = $1',
      ['pending']
    );

    // Get recent payments
    const recentPaymentsResult = await pool.query(
      `SELECT ap.*, a.name as admin_name, sp.name as plan_name 
       FROM admin_payments ap 
       JOIN admins a ON ap.admin_id = a.id 
       JOIN admin_subscriptions asub ON ap.subscription_id = asub.id
       JOIN subscription_plans sp ON asub.plan_id = sp.id
       ORDER BY ap.created_at DESC 
       LIMIT 10`
    );

    // Get monthly revenue trend (last 6 months)
    const revenueTrendResult = await pool.query(
      `SELECT month_year, total_revenue, admin_count 
       FROM platform_revenue 
       ORDER BY month_year DESC 
       LIMIT 6`
    );

    // Calculate monthly commission (sum of all commissions from admin sales for the current month)
    // Join customer_purchases -> stocks (for admin_id) -> admin_subscriptions (for plan_id)
    const commissionResult = await pool.query(`
      SELECT SUM(
        cp.total_amount * 
        CASE asub.plan_id
          WHEN 1 THEN 0.15
          WHEN 2 THEN 0.10
          WHEN 3 THEN 0.05
          ELSE 0.15
        END
      ) AS monthly_commission
      FROM customer_purchases cp
      JOIN stocks s ON cp.stock_id = s.id
      JOIN admin_subscriptions asub ON s.admin_id = asub.admin_id AND asub.status = 'active'
      WHERE cp.purchase_date >= $1 AND cp.purchase_date < $2
    `, [monthStart, monthEnd]);
    const monthlyCommission = parseFloat(commissionResult.rows[0].monthly_commission) || 0;

    // Get active admin count
    const activeAdminCountResult = await pool.query(
      "SELECT COUNT(*) as active_admins FROM admins WHERE status = 'active'"
    );

    const stats = {
      currentMonth: {
        revenue: actualRevenueResult.rows[0]?.total_revenue || 0,
        totalRevenue: totalRevenueResult.rows[0]?.total_revenue || 0,
        commission: monthlyCommission,
        activeAdminCount: activeAdminCountResult.rows[0]?.active_admins || 0,
        activeSubscriptions: activeSubscriptionsResult.rows[0]?.active_count || 0,
        pendingRequests: pendingRequestsResult.rows[0]?.pending_count || 0
      },
      recentPayments: recentPaymentsResult.rows,
      revenueTrend: revenueTrendResult.rows.reverse()
    };

    res.json(stats);

  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard stats', error: err.message });
  }
};

// Get All Admin Subscriptions
const getAllAdminSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        asub.*,
        a.name as admin_name,
        a.email as admin_email,
        sp.name as plan_name,
        sp.price as plan_price
      FROM admin_subscriptions asub
      JOIN admins a ON asub.admin_id = a.id
      JOIN subscription_plans sp ON asub.plan_id = sp.id
    `;

    const queryParams = [];
    let whereClause = '';

    if (status) {
      whereClause = 'WHERE asub.status = $1';
      queryParams.push(status);
    }

    query += whereClause + ' ORDER BY asub.created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination (may be filtered by status)
    let countQuery = 'SELECT COUNT(*) FROM admin_subscriptions asub JOIN admins a ON asub.admin_id = a.id';
    if (status) {
      countQuery += ' WHERE asub.status = $1';
    }
    const countResult = await pool.query(countQuery, status ? [status] : []);

    // Metrics for active subscriptions only
    const [revenueResult, activeCountResult, avgResult] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(monthly_fee), 0) AS total_revenue FROM admin_subscriptions WHERE status = 'active'`),
      pool.query(`SELECT COUNT(*) AS active_count FROM admin_subscriptions WHERE status = 'active'`),
      pool.query(`SELECT COALESCE(AVG(monthly_fee), 0) AS avg_revenue FROM admin_subscriptions WHERE status = 'active'`)
    ]);

    const totalRevenue = parseFloat(revenueResult.rows[0].total_revenue) || 0;
    const activeCount = parseInt(activeCountResult.rows[0].active_count) || 0;
    const avgRevenue = parseFloat(avgResult.rows[0].avg_revenue) || 0;
    const totalCount = activeCount; // Only active subscriptions are counted

    res.json({
      subscriptions: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
        totalItems: parseInt(countResult.rows[0].count),
        itemsPerPage: parseInt(limit)
      },
      metrics: {
        totalRevenue,
        activeCount,
        avgRevenue,
        totalCount
      }
    });

  } catch (err) {
    console.error('Get admin subscriptions error:', err);
    res.status(500).json({ message: 'Failed to fetch subscriptions', error: err.message });
  }
};

// Get All Admin Requests
const getAllAdminRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        ar.*,
        COALESCE(sp.name, 'Basic') as plan_name,
        COALESCE(sp.price, 999.00) as plan_price
       FROM admin_requests ar
       LEFT JOIN subscription_plans sp ON ar.plan_id = sp.id
    `;

    const queryParams = [];
    let whereClause = '';

    if (status) {
      whereClause = 'WHERE ar.status = $1';
      queryParams.push(status);
    }

    query += whereClause + ' ORDER BY ar.created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM admin_requests ar';
    if (status) {
      countQuery += ' WHERE ar.status = $1';
    }
    const countResult = await pool.query(countQuery, status ? [status] : []);

    res.json({
      requests: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult.rows[0].count / limit),
        totalItems: parseInt(countResult.rows[0].count),
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (err) {
    console.error('Get admin requests error:', err);
    res.status(500).json({ message: 'Failed to fetch admin requests', error: err.message });
  }
};

// Approve Admin Request
const approveAdminRequest = async (req, res) => {
  const { requestId } = req.params;
  const superAdminId = req.superAdmin.id;

  try {
    // Get the admin request
    const requestResult = await pool.query(
      `SELECT ar.*, sp.price as plan_price, sp.name as plan_name 
       FROM admin_requests ar 
       JOIN subscription_plans sp ON ar.plan_id = sp.id 
       WHERE ar.id = $1 AND ar.status = 'pending'`,
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: 'Admin request not found or already processed' });
    }

    const request = requestResult.rows[0];

    // Check if admin already exists
    const existingAdmin = await pool.query(
      'SELECT id FROM admins WHERE email = $1',
      [request.email]
    );

    if (existingAdmin.rows.length > 0) {
      return res.status(400).json({ message: 'Admin with this email already exists' });
    }

    // Check if subscription already exists
    const existingSubscription = await pool.query(
      'SELECT id FROM admin_subscriptions WHERE admin_id = (SELECT id FROM admins WHERE email = $1)',
      [request.email]
    );

    if (existingSubscription.rows.length > 0) {
      return res.status(400).json({ message: 'Subscription for this email already exists' });
    }

    // Generate a secure password setup token
    const crypto = require('crypto');
    const setupToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create admin account with temporary password (will be changed via setup)
    const tempPassword = crypto.randomBytes(16).toString('hex');
    const hashedTempPassword = await bcrypt.hash(tempPassword, 10);

    await pool.query(
      'INSERT INTO admins (name, email, password) VALUES ($1, $2, $3)',
      [request.name, request.email, hashedTempPassword]
    );

    // Get the created admin
    const adminResult = await pool.query(
      'SELECT id FROM admins WHERE email = $1',
      [request.email]
    );
    const adminId = adminResult.rows[0].id;

    // Create subscription
    await pool.query(
      `INSERT INTO admin_subscriptions (admin_id, plan_id, status, monthly_fee, payment_date, next_payment_date) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        adminId,
        request.plan_id,
        'active',
        request.plan_price,
        new Date(),
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      ]
    );

    // Store password setup token
    await pool.query(
      'INSERT INTO password_setup_tokens (admin_id, token, expires_at) VALUES ($1, $2, $3)',
      [adminId, setupToken, tokenExpiry]
    );

    // Update request status
    await pool.query(
      'UPDATE admin_requests SET status = $1 WHERE id = $2',
      ['approved', requestId]
    );

    // Record payment
    await pool.query(
      `INSERT INTO admin_payments (admin_id, subscription_id, amount, payment_method, status, transaction_id) 
       VALUES ($1, (SELECT id FROM admin_subscriptions WHERE admin_id = $1), $2, 'razorpay', 'completed', $3)`,
      [adminId, request.plan_price, request.payment_id]
    );

    // Update platform revenue
    const currentMonth = new Date().toISOString().slice(0, 7);
    await pool.query(
      `INSERT INTO platform_revenue (month_year, total_revenue, admin_count) 
       VALUES ($1, $2, 1) 
       ON CONFLICT (month_year) 
       DO UPDATE SET 
         total_revenue = platform_revenue.total_revenue + $2,
         admin_count = platform_revenue.admin_count + 1`,
      [currentMonth, request.plan_price]
    );

    // Send approval email with password setup link
    const setupLink = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/admin/setup-password?token=${setupToken}`;
    
    await sendApprovalEmail(
      request.email, 
      request.name, 
      request.plan_name, 
      request.plan_price,
      setupLink
    );

    // Log the approval action
    await pool.query(
      'INSERT INTO super_admin_logs (super_admin_id, action, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
      [
        superAdminId,
        'ADMIN_APPROVED',
        { 
          admin_email: request.email, 
          admin_name: request.name,
          plan_name: request.plan_name,
          plan_price: request.plan_price 
        },
        req.ip,
        req.headers['user-agent']
      ]
    );

    res.json({ 
      message: 'Admin request approved successfully',
      admin: {
        id: adminId,
        name: request.name,
        email: request.email,
        plan: request.plan_name,
        price: request.plan_price
      }
    });

  } catch (err) {
    console.error('Error approving admin request:', err);
    res.status(500).json({ message: 'Failed to approve admin request', error: err.message });
  }
};

// Reject Admin Request
const rejectAdminRequest = async (req, res) => {
  const { requestId } = req.params;
  const { notes } = req.body;
  const superAdminId = req.superAdmin.id;

  try {
    // First get the request details for logging
    const requestResult = await pool.query(
      'SELECT * FROM admin_requests WHERE id = $1 AND status = $2',
      [requestId, 'pending']
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: 'Request not found or already processed' });
    }

    const request = requestResult.rows[0];

    // Delete the request from database so the same email can apply again
    const deleteResult = await pool.query(
      'DELETE FROM admin_requests WHERE id = $1 AND status = $2',
      [requestId, 'pending']
    );

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ message: 'Request not found or already processed' });
    }

    // Log the action with request details before deletion
    await pool.query(
      'INSERT INTO super_admin_logs (super_admin_id, action, details, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5)',
      [
        superAdminId,
        'REJECT_ADMIN_REQUEST',
        { 
          requestId, 
          notes, 
          email: request.email,
          name: request.name,
          company_name: request.store_name,
          business_category: request.store_category,
          business_location: request.store_location
        },
        req.ip,
        req.headers['user-agent']
      ]
    );

    // Send rejection email to applicant
    await sendRejectionEmail(request.email, request.name, request.store_name, notes);

    res.json({ message: 'Admin request rejected and removed successfully' });

  } catch (err) {
    console.error('Reject admin request error:', err);
    res.status(500).json({ message: 'Failed to reject request', error: err.message });
  }
};

// Get Platform Revenue
const getPlatformRevenue = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    // Get monthly revenue and active subscription count from admin_subscriptions
    const result = await pool.query(
      `SELECT to_char(payment_date, 'YYYY-MM') AS month_year,
              COALESCE(SUM(monthly_fee), 0) AS total_revenue,
              COUNT(*) FILTER (WHERE status = 'active') AS active_subscriptions
       FROM admin_subscriptions
       WHERE status = 'active' AND to_char(payment_date, 'YYYY') = $1
       GROUP BY month_year
       ORDER BY month_year`,
      [currentYear]
    );

    res.json(result.rows);

  } catch (err) {
    console.error('Get platform revenue error:', err);
    res.status(500).json({ message: 'Failed to fetch revenue data', error: err.message });
  }
};

// Get Super Admin Logs
const getSuperAdminLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, action } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        sal.*,
        sa.name as super_admin_name
      FROM super_admin_logs sal
      JOIN super_admins sa ON sal.super_admin_id = sa.id
    `;

    const queryParams = [];
    let whereClause = '';

    if (action) {
      whereClause = 'WHERE sal.action = $1';
      queryParams.push(action);
    }

    query += whereClause + ' ORDER BY sal.created_at DESC LIMIT $' + (queryParams.length + 1) + ' OFFSET $' + (queryParams.length + 2);
    queryParams.push(limit, offset);

    const result = await pool.query(query, queryParams);

    res.json(result.rows);

  } catch (err) {
    console.error('Get super admin logs error:', err);
    res.status(500).json({ message: 'Failed to fetch logs', error: err.message });
  }
};

// Payout to Admin (Revenue After Commission)
const payoutToAdmin = async (req, res) => {
  const { adminId } = req.params;
  const superAdminId = req.superAdmin.id;

  try {
    // 1. Get last payout timestamp for this admin
    const lastPayoutResult = await pool.query(
      'SELECT paid_at FROM payouts WHERE admin_id = $1 ORDER BY paid_at DESC LIMIT 1',
      [adminId]
    );
    const lastPayout = lastPayoutResult.rows[0]?.paid_at || '1970-01-01';

    // 2. Get admin's current plan ID
    const planResult = await pool.query(
      `SELECT asub.plan_id
       FROM admin_subscriptions asub
       WHERE asub.admin_id = $1 AND asub.status = 'active'
       ORDER BY asub.created_at DESC LIMIT 1`,
      [adminId]
    );
    if (planResult.rows.length === 0) {
      return res.status(404).json({ message: 'Admin does not have an active subscription plan.' });
    }
    const planId = planResult.rows[0].plan_id;

    // 3. Determine commission rate based on plan ID
    let commissionRate = 0.15; // Default to 15%
    if (planId === 2) commissionRate = 0.10;
    else if (planId === 3) commissionRate = 0.05;

    // 4. Sum all purchases for this admin since last payout
    // Join customer_purchases -> stocks (for admin_id)
    const revenueResult = await pool.query(
      `SELECT COALESCE(SUM(cp.total_amount), 0) AS gross_revenue
       FROM customer_purchases cp
       JOIN stocks s ON cp.stock_id = s.id
       WHERE s.admin_id = $1 AND cp.purchase_date > $2`,
      [adminId, lastPayout]
    );
    const grossRevenue = parseFloat(revenueResult.rows[0].gross_revenue) || 0;

    // 5. Calculate revenue after commission
    const payoutAmount = +(grossRevenue * (1 - commissionRate)).toFixed(2);

    // 6. Insert payout record
    await pool.query(
      'INSERT INTO payouts (admin_id, amount, paid_by) VALUES ($1, $2, $3)',
      [adminId, payoutAmount, superAdminId]
    );

    // 7. Return payout amount
    res.json({ success: true, amount: payoutAmount, commissionRate, grossRevenue });
  } catch (err) {
    console.error('Payout to admin error:', err);
    res.status(500).json({ message: 'Failed to process payout', error: err.message });
  }
};

// Get current earnings after commission for an admin
const getAdminEarningsAfterCommission = async (req, res) => {
  const { adminId } = req.params;
  try {
    // 1. Get last payout timestamp for this admin
    const lastPayoutResult = await pool.query(
      'SELECT paid_at FROM payouts WHERE admin_id = $1 ORDER BY paid_at DESC LIMIT 1',
      [adminId]
    );
    const lastPayout = lastPayoutResult.rows[0]?.paid_at || '1970-01-01';

    // 2. Get admin's current plan ID
    const planResult = await pool.query(
      `SELECT asub.plan_id
       FROM admin_subscriptions asub
       WHERE asub.admin_id = $1 AND asub.status = 'active'
       ORDER BY asub.created_at DESC LIMIT 1`,
      [adminId]
    );
    if (planResult.rows.length === 0) {
      return res.status(404).json({ message: 'Admin does not have an active subscription plan.' });
    }
    const planId = planResult.rows[0].plan_id;

    // 3. Determine commission rate based on plan ID
    let commissionRate = 0.15; // Default to 15%
    if (planId === 2) commissionRate = 0.10;
    else if (planId === 3) commissionRate = 0.05;

    // 4. Sum all purchases for this admin since last payout
    // Join customer_purchases -> stocks (for admin_id)
    const revenueResult = await pool.query(
      `SELECT COALESCE(SUM(cp.total_amount), 0) AS gross_revenue
       FROM customer_purchases cp
       JOIN stocks s ON cp.stock_id = s.id
       WHERE s.admin_id = $1 AND cp.purchase_date > $2`,
      [adminId, lastPayout]
    );
    const grossRevenue = parseFloat(revenueResult.rows[0].gross_revenue) || 0;

    // 5. Calculate earnings after commission
    const earningsAfterCommission = +(grossRevenue * (1 - commissionRate)).toFixed(2);

    // 6. Return the value
    res.json({ success: true, earningsAfterCommission, commissionRate, grossRevenue });
  } catch (err) {
    console.error('Get admin earnings after commission error:', err);
    res.status(500).json({ message: 'Failed to fetch earnings', error: err.message });
  }
};

// Get recent payouts (for super admin revenue analytics)
const getRecentPayouts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.amount, p.paid_at, 
             a.name AS admin_name, a.email AS admin_email,
             sa.name AS super_admin_name, sa.email AS super_admin_email
      FROM payouts p
      JOIN admins a ON p.admin_id = a.id
      JOIN super_admins sa ON p.paid_by = sa.id
      ORDER BY p.paid_at DESC
      LIMIT 20
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Get recent payouts error:', err);
    res.status(500).json({ message: 'Failed to fetch recent payouts', error: err.message });
  }
};

// Get Monthly Revenue Trend (with 28th cutoff rule)
const getMonthlyRevenueTrend = async (req, res) => {
  try {
    // Generate the last 12 months (including current month)
    const monthsResult = await pool.query(`
      SELECT TO_CHAR(date_trunc('month', CURRENT_DATE) - INTERVAL '1 month' * gs.n, 'YYYY-MM') AS month
      FROM generate_series(0, 11) AS gs(n)
      ORDER BY month DESC
    `);
    const months = monthsResult.rows.map(row => row.month);

    // Get actual data with 30th cutoff rule
    const dataResult = await pool.query(`
      WITH adjusted_subs AS (
        SELECT *,
          TO_CHAR(
            CASE
              WHEN EXTRACT(DAY FROM created_at) < 30 THEN created_at
              ELSE created_at + INTERVAL '1 month'
            END,
            'YYYY-MM'
          ) AS active_month
        FROM admin_subscriptions
        WHERE status = 'active'
      )
      SELECT
        active_month AS month,
        SUM(monthly_fee) AS total_active_revenue,
        COUNT(*) AS total_active_count
      FROM adjusted_subs
      GROUP BY active_month
    `);
    const dataMap = {};
    dataResult.rows.forEach(row => {
      dataMap[row.month] = {
        month: row.month,
        total_active_revenue: parseFloat(row.total_active_revenue) || 0,
        total_active_count: parseInt(row.total_active_count) || 0
      };
    });

    // Merge months and fill zeroes where needed
    const result = months.map(month =>
      dataMap[month] || {
        month,
        total_active_revenue: 0,
        total_active_count: 0
      }
    );

    res.json(result);
  } catch (err) {
    console.error('Get monthly revenue trend error:', err);
    res.status(500).json({ message: 'Failed to fetch monthly revenue trend', error: err.message });
  }
};

// Approve admin cancellation request
const approveAdminCancellation = async (req, res) => {
  const { adminId } = req.params;
  try {
    // Find pending cancellation request
    const requestResult = await pool.query(
      'SELECT * FROM admin_cancellation_requests WHERE admin_id = $1 AND status = $2',
      [adminId, 'pending']
    );
    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: 'No pending cancellation request for this admin.' });
    }
    // Approve the request
    await pool.query(
      `UPDATE admin_cancellation_requests SET status = 'approved', resolved_at = NOW() WHERE admin_id = $1 AND status = 'pending'`,
      [adminId]
    );
    // Set admin_subscriptions and admins to inactive
    await pool.query(
      `UPDATE admin_subscriptions SET status = 'inactive' WHERE admin_id = $1 AND status = 'active'`,
      [adminId]
    );
    await pool.query(
      `UPDATE admins SET status = 'inactive' WHERE id = $1 AND status = 'active'`,
      [adminId]
    );
    res.json({ message: 'Admin cancellation approved and account deactivated.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to approve cancellation', error: err.message });
  }
};

// Reject admin cancellation request
const rejectAdminCancellation = async (req, res) => {
  const { adminId } = req.params;
  const { notes } = req.body;
  try {
    // Find pending cancellation request
    const requestResult = await pool.query(
      'SELECT * FROM admin_cancellation_requests WHERE admin_id = $1 AND status = $2',
      [adminId, 'pending']
    );
    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: 'No pending cancellation request for this admin.' });
    }
    // Reject the request
    await pool.query(
      `UPDATE admin_cancellation_requests SET status = 'rejected', resolved_at = NOW(), notes = $2 WHERE admin_id = $1 AND status = 'pending'`,
      [adminId, notes || null]
    );
    res.json({ message: 'Admin cancellation request rejected.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to reject cancellation', error: err.message });
  }
};

// Get all admin cancellation requests (optionally filter by status)
const getAdminCancellationRequests = async (req, res) => {
  const { status } = req.query;
  try {
    let query = `
      SELECT acr.*, a.name as admin_name, a.email as admin_email
      FROM admin_cancellation_requests acr
      JOIN admins a ON acr.admin_id = a.id
    `;
    const params = [];
    if (status) {
      query += ' WHERE acr.status = $1';
      params.push(status);
    }
    query += ' ORDER BY acr.requested_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch cancellation requests', error: err.message });
  }
};

// Get Change Plan Requests (Super Admin)
const getChangePlanRequests = async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT r.*, a.name as admin_name, a.email as admin_email, 
        oldp.name as old_plan_name, newp.name as new_plan_name
      FROM admin_change_plan_requests r
      JOIN admins a ON r.admin_id = a.id
      JOIN subscription_plans oldp ON r.old_plan_id = oldp.id
      JOIN subscription_plans newp ON r.new_plan_id = newp.id
    `;
    const params = [];
    if (status) {
      query += ' WHERE r.status = $1';
      params.push(status);
    }
    query += ' ORDER BY r.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get change plan requests error:', err);
    res.status(500).json({ message: 'Failed to fetch change plan requests', error: err.message });
  }
};

// Approve Change Plan Request (Super Admin)
const approveChangePlanRequest = async (req, res) => {
  try {
    const { id } = req.params;
    // Get the request
    const reqResult = await pool.query('SELECT * FROM admin_change_plan_requests WHERE id = $1 AND status = $2', [id, 'pending']);
    if (reqResult.rows.length === 0) {
      return res.status(404).json({ message: 'Request not found or not pending' });
    }
    const request = reqResult.rows[0];
    // Deactivate all current subscriptions for this admin
    await pool.query('UPDATE admin_subscriptions SET status = $1 WHERE admin_id = $2 AND status = $3', ['inactive', request.admin_id, 'active']);
    // Insert new subscription row
    const planResult = await pool.query('SELECT * FROM subscription_plans WHERE id = $1', [request.new_plan_id]);
    const plan = planResult.rows[0];
    await pool.query(
      `INSERT INTO admin_subscriptions (admin_id, plan_id, status, monthly_fee, payment_date, next_payment_date)
       VALUES ($1, $2, 'active', $3, NOW(), NOW() + INTERVAL '1 month')`,
      [request.admin_id, request.new_plan_id, plan.price]
    );
    // Mark request as approved
    await pool.query('UPDATE admin_change_plan_requests SET status = $1, updated_at = NOW() WHERE id = $2', ['approved', id]);
    res.json({ message: 'Change plan request approved and subscription updated.' });
  } catch (err) {
    console.error('Approve change plan request error:', err);
    res.status(500).json({ message: 'Failed to approve change plan request', error: err.message });
  }
};

// Reject Change Plan Request (Super Admin)
const rejectChangePlanRequest = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE admin_change_plan_requests SET status = $1, updated_at = NOW() WHERE id = $2', ['rejected', id]);
    res.json({ message: 'Change plan request rejected.' });
  } catch (err) {
    console.error('Reject change plan request error:', err);
    res.status(500).json({ message: 'Failed to reject change plan request', error: err.message });
  }
};

module.exports = {
  loginSuperAdmin,
  getDashboardStats,
  getAllAdminSubscriptions,
  getAllAdminRequests,
  approveAdminRequest,
  rejectAdminRequest,
  getPlatformRevenue,
  getSuperAdminLogs,
  payoutToAdmin,
  getAdminEarningsAfterCommission,
  getRecentPayouts,
  getMonthlyRevenueTrend,
  approveAdminCancellation,
  rejectAdminCancellation,
  getAdminCancellationRequests,
  getChangePlanRequests,
  approveChangePlanRequest,
  rejectChangePlanRequest
}; 