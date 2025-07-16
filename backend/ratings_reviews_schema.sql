-- Ratings and Reviews Schema for Retail Stock Rebalancer
-- This schema allows customers to rate stores and write reviews

-- Create ratings table
CREATE TABLE IF NOT EXISTS store_ratings (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_photos TEXT[], -- Array of photo URLs
    is_verified_purchase BOOLEAN DEFAULT false,
    helpful_votes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, customer_id) -- One rating per customer per store
);

-- Create review_photos table for better photo management
CREATE TABLE IF NOT EXISTS review_photos (
    id SERIAL PRIMARY KEY,
    rating_id INTEGER NOT NULL REFERENCES store_ratings(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_alt TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create helpful_votes table to track who voted on reviews
CREATE TABLE IF NOT EXISTS review_votes (
    id SERIAL PRIMARY KEY,
    rating_id INTEGER NOT NULL REFERENCES store_ratings(id) ON DELETE CASCADE,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL, -- true for helpful, false for not helpful
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rating_id, customer_id) -- One vote per customer per review
);

-- Create review_reports table for moderation
CREATE TABLE IF NOT EXISTS review_reports (
    id SERIAL PRIMARY KEY,
    rating_id INTEGER NOT NULL REFERENCES store_ratings(id) ON DELETE CASCADE,
    reporter_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    reason TEXT NOT NULL, -- 'inappropriate', 'spam', 'fake', etc.
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_store_ratings_store_id ON store_ratings(store_id);
CREATE INDEX IF NOT EXISTS idx_store_ratings_customer_id ON store_ratings(customer_id);
CREATE INDEX IF NOT EXISTS idx_store_ratings_rating ON store_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_store_ratings_created_at ON store_ratings(created_at);
CREATE INDEX IF NOT EXISTS idx_review_photos_rating_id ON review_photos(rating_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_rating_id ON review_votes(rating_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_rating_id ON review_reports(rating_id);
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON review_reports(status);

-- Create a view for store rating statistics
CREATE OR REPLACE VIEW store_rating_stats AS
SELECT 
    s.id as store_id,
    s.name as store_name,
    s.location as store_location,
    s.category as store_category,
    COUNT(sr.id) as total_ratings,
    AVG(sr.rating) as average_rating,
    COUNT(CASE WHEN sr.rating = 5 THEN 1 END) as five_star_count,
    COUNT(CASE WHEN sr.rating = 4 THEN 1 END) as four_star_count,
    COUNT(CASE WHEN sr.rating = 3 THEN 1 END) as three_star_count,
    COUNT(CASE WHEN sr.rating = 2 THEN 1 END) as two_star_count,
    COUNT(CASE WHEN sr.rating = 1 THEN 1 END) as one_star_count,
    COUNT(CASE WHEN sr.is_verified_purchase = true THEN 1 END) as verified_purchases,
    MAX(sr.created_at) as last_review_date
FROM stores s
LEFT JOIN store_ratings sr ON s.id = sr.store_id
GROUP BY s.id, s.name, s.location, s.category;

-- Create a function to update store rating statistics
CREATE OR REPLACE FUNCTION update_store_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- This function will be called when ratings are inserted/updated/deleted
    -- For now, we'll use the view, but in production you might want to cache this
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update rating stats
CREATE TRIGGER trigger_update_rating_stats
    AFTER INSERT OR UPDATE OR DELETE ON store_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_store_rating_stats();

-- Note: Sample data will be added later when we have actual customers
-- For now, just create the tables and structure 