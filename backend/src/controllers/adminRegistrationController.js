const bcrypt = require('bcrypt');
const pool = require('../config/db');
const Razorpay = require('razorpay');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Get available subscription plans
const getSubscriptionPlans = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price ASC'
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Get subscription plans error:', err);
    res.status(500).json({ message: 'Failed to fetch subscription plans', error: err.message });
  }
};

// Create admin registration request
const createAdminRequest = async (req, res) => {
  console.log("Received registration request:", req.body);
  console.log("Request headers:", req.headers);
  
  const { name, email, company_name, business_category, business_location, plan_id } = req.body;

  try {
    // Validate required fields
    console.log("Validating fields:", { 
      name: !!name, 
      email: !!email, 
      company_name: !!company_name, 
      business_category: !!business_category, 
      business_location: !!business_location, 
      plan_id: !!plan_id 
    });
    
    if (!name || !email || !company_name || !business_category || !business_location || !plan_id) {
      console.log("Missing required fields:", { name, email, company_name, business_category, business_location, plan_id });
      return res.status(400).json({ 
        message: 'All fields are required',
        missing_fields: {
          name: !name,
          email: !email,
          company_name: !company_name,
          business_category: !business_category,
          business_location: !business_location,
          plan_id: !plan_id
        }
      });
    }

    // Check if email already exists in admin_requests
    const existingRequest = await pool.query(
      'SELECT * FROM admin_requests WHERE email = $1',
      [email]
    );

    if (existingRequest.rows.length > 0) {
      return res.status(400).json({ message: 'An application with this email already exists' });
    }

    // Check if email already exists in admins table
    const existingAdmin = await pool.query(
      'SELECT * FROM admins WHERE email = $1',
      [email]
    );

    if (existingAdmin.rows.length > 0) {
      return res.status(400).json({ message: 'A supplier account with this email already exists' });
    }

    // Get plan details
    const planResult = await pool.query(
      'SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true',
      [plan_id]
    );

    if (planResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid subscription plan' });
    }

    const plan = planResult.rows[0];
    console.log("Selected plan:", plan);

    // Create admin request
    const result = await pool.query(
      `INSERT INTO admin_requests 
       (name, email, store_name, store_category, store_location, plan_id, status, payment_status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        name,
        email,
        company_name, // store_name field stores company_name
        business_category, // store_category field stores business_category
        business_location, // store_location field stores business_location
        plan_id,
        'pending',
        'pending',
        'Supplier registration request created'
      ]
    );

    const adminRequest = result.rows[0];
    console.log("Created admin request:", adminRequest);

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: plan.price * 100, // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `supplier_request_${adminRequest.id}`,
      notes: {
        admin_request_id: adminRequest.id.toString(),
        email: email,
        plan_name: plan.name,
        company_name: company_name
      }
    });

    console.log("Created Razorpay order:", order);

    // Update admin request with order ID
    await pool.query(
      'UPDATE admin_requests SET razorpay_order_id = $1 WHERE id = $2',
      [order.id, adminRequest.id]
    );

    res.json({
      message: 'Supplier registration request created successfully',
      admin_request: adminRequest,
      payment_order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: process.env.RAZORPAY_KEY_ID
      }
    });

  } catch (err) {
    console.error('Create admin request error:', err);
    res.status(500).json({ message: 'Failed to create supplier registration request', error: err.message });
  }
};

// Verify payment and update request status
const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  try {
    // Verify payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const signature = require('crypto')
      .createHmac('sha256', process.env.RAZORPAY_SECRET)
      .update(text)
      .digest('hex');

    if (signature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid payment signature' });
    }

    // Get admin request
    const requestResult = await pool.query(
      'SELECT * FROM admin_requests WHERE razorpay_order_id = $1',
      [razorpay_order_id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: 'Admin request not found' });
    }

    const adminRequest = requestResult.rows[0];

    // Update payment status
    await pool.query(
      'UPDATE admin_requests SET payment_status = $1 WHERE id = $2',
      ['paid', adminRequest.id]
    );

    // Create payment record
    await pool.query(
      `INSERT INTO admin_payments 
       (admin_id, subscription_id, amount, status, transaction_id, payment_method, razorpay_order_id, razorpay_payment_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        null, // admin_id will be set when approved
        null, // subscription_id will be set when approved
        adminRequest.plan_price || 999,
        'successful',
        razorpay_payment_id,
        'razorpay',
        razorpay_order_id,
        razorpay_payment_id
      ]
    );

    // TODO: Send email notification to super admin about new paid request

    res.json({
      message: 'Payment verified successfully',
      admin_request_id: adminRequest.id
    });

  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ message: 'Failed to verify payment', error: err.message });
  }
};

// Get admin request status
const getAdminRequestStatus = async (req, res) => {
  const { email } = req.query;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const result = await pool.query(
      `SELECT ar.*, sp.name as plan_name, sp.price as plan_price
       FROM admin_requests ar
       LEFT JOIN subscription_plans sp ON ar.plan_id = sp.id
       WHERE ar.email = $1
       ORDER BY ar.created_at DESC
       LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Admin request not found' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Get admin request status error:', err);
    res.status(500).json({ message: 'Failed to get request status', error: err.message });
  }
};

module.exports = {
  getSubscriptionPlans,
  createAdminRequest,
  verifyPayment,
  getAdminRequestStatus
}; 