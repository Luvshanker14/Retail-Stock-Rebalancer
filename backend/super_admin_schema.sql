-- Super Admin System Database Schema

-- 1. Super Admins Table (Platform Owners)
CREATE TABLE IF NOT EXISTS super_admins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    secret_2fa VARCHAR(255), -- TOTP secret for 2FA
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    failed_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    duration_days INTEGER NOT NULL, -- 30 for monthly, 365 for yearly
    features JSONB, -- Store features as JSON
    is_active BOOLEAN DEFAULT true,
    trial_days INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Admin Subscriptions Table (Paying Store Admins)
CREATE TABLE IF NOT EXISTS admin_subscriptions (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES subscription_plans(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, active, suspended, cancelled
    monthly_fee DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP,
    next_payment_date TIMESTAMP,
    trial_end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Payment History Table
CREATE TABLE IF NOT EXISTS admin_payments (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES admin_subscriptions(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending', -- pending, successful, failed, refunded
    transaction_id VARCHAR(255),
    payment_method VARCHAR(50), -- razorpay, stripe, etc.
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Platform Revenue Table (Monthly Aggregates)
CREATE TABLE IF NOT EXISTS platform_revenue (
    id SERIAL PRIMARY KEY,
    month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    total_revenue DECIMAL(12,2) DEFAULT 0,
    admin_count INTEGER DEFAULT 0,
    active_subscriptions INTEGER DEFAULT 0,
    new_subscriptions INTEGER DEFAULT 0,
    cancelled_subscriptions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(month_year)
);

-- 6. Super Admin Action Logs Table
CREATE TABLE IF NOT EXISTS super_admin_logs (
    id SERIAL PRIMARY KEY,
    super_admin_id INTEGER REFERENCES super_admins(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- approve_admin, suspend_admin, etc.
    details JSONB, -- Store action details as JSON
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Admin Requests Table (Pending Approvals)
CREATE TABLE IF NOT EXISTS admin_requests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    store_name VARCHAR(255) NOT NULL,
    store_category VARCHAR(100),
    store_location TEXT,
    plan_id INTEGER REFERENCES subscription_plans(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed
    razorpay_order_id VARCHAR(255),
    notes TEXT, -- Super admin notes
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, price, duration_days, features, trial_days) VALUES
('Basic', 999.00, 30, '["Store Management", "Stock Tracking", "Basic Analytics", "Email Alerts"]', 7),
('Premium', 1999.00, 30, '["Advanced Analytics", "Multi-Store Support", "Priority Support", "Custom Reports"]', 7),
('Enterprise', 4999.00, 30, '["Custom Integrations", "Dedicated Support", "API Access", "White Label"]', 7)
ON CONFLICT DO NOTHING;

-- Insert default super admin (you'll need to update this with your details)
INSERT INTO super_admins (name, email, password_hash) VALUES
('Platform Owner', 'admin@retailstock.com', '$2b$10$default_hashed_password_here')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_subscriptions_status ON admin_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_admin_payments_status ON admin_payments(status);
CREATE INDEX IF NOT EXISTS idx_admin_requests_status ON admin_requests(status);
CREATE INDEX IF NOT EXISTS idx_platform_revenue_month ON platform_revenue(month_year);
CREATE INDEX IF NOT EXISTS idx_super_admin_logs_action ON super_admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_super_admin_logs_created_at ON super_admin_logs(created_at); 