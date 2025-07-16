-- Customer Features Schema for Retail Stock Rebalancer
-- This schema adds wishlist, purchase history, and recommendation features

-- Create wishlist table
CREATE TABLE IF NOT EXISTS customer_wishlist (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    stock_id INTEGER NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, stock_id) -- One item per customer per stock
);

-- Create purchase history table
CREATE TABLE IF NOT EXISTS customer_purchases (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    stock_id INTEGER NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_per_unit DECIMAL(10,2) NOT NULL CHECK (price_per_unit > 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
    order_id VARCHAR(255), -- Razorpay order ID
    payment_status VARCHAR(20) DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed')),
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_sent BOOLEAN DEFAULT false
);

-- Create customer preferences table for recommendations
CREATE TABLE IF NOT EXISTS customer_preferences (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    category VARCHAR(100),
    location VARCHAR(100),
    price_range_min DECIMAL(10,2),
    price_range_max DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, category, location)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_wishlist_customer_id ON customer_wishlist(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_wishlist_stock_id ON customer_wishlist(stock_id);
CREATE INDEX IF NOT EXISTS idx_customer_wishlist_store_id ON customer_wishlist(store_id);
CREATE INDEX IF NOT EXISTS idx_customer_purchases_customer_id ON customer_purchases(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_purchases_stock_id ON customer_purchases(stock_id);
CREATE INDEX IF NOT EXISTS idx_customer_purchases_store_id ON customer_purchases(store_id);
CREATE INDEX IF NOT EXISTS idx_customer_purchases_purchase_date ON customer_purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_customer_preferences_customer_id ON customer_preferences(customer_id);

-- Create a view for customer purchase statistics
CREATE OR REPLACE VIEW customer_purchase_stats AS
SELECT 
    c.id as customer_id,
    c.name as customer_name,
    c.email as customer_email,
    COUNT(cp.id) as total_purchases,
    SUM(cp.total_amount) as total_spent,
    AVG(cp.total_amount) as avg_purchase_amount,
    MAX(cp.purchase_date) as last_purchase_date,
    COUNT(DISTINCT cp.store_id) as stores_visited,
    COUNT(DISTINCT cp.stock_id) as unique_products_purchased
FROM customers c
LEFT JOIN customer_purchases cp ON c.id = cp.customer_id
GROUP BY c.id, c.name, c.email;

-- Create a view for product popularity (for recommendations)
CREATE OR REPLACE VIEW product_popularity AS
SELECT 
    s.id as stock_id,
    s.name as stock_name,
    st.id as store_id,
    st.name as store_name,
    st.location as store_location,
    st.category as store_category,
    COUNT(cp.id) as purchase_count,
    SUM(cp.quantity) as total_quantity_sold,
    SUM(cp.total_amount) as total_revenue,
    AVG(cp.price_per_unit) as avg_price
FROM stocks s
JOIN stores st ON s.store_id = st.id
LEFT JOIN customer_purchases cp ON s.id = cp.stock_id
GROUP BY s.id, s.name, st.id, st.name, st.location, st.category;

-- Create a function to update customer preferences based on purchases
CREATE OR REPLACE FUNCTION update_customer_preferences()
RETURNS TRIGGER AS $$
BEGIN
    -- This function will be called when purchases are made
    -- It will update customer preferences based on their purchase history
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update customer preferences
CREATE TRIGGER trigger_update_customer_preferences
    AFTER INSERT ON customer_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_preferences(); 