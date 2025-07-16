-- Admins Table Schema
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_created_at ON admins(created_at);
ALTER TABLE admins ADD COLUMN status VARCHAR(20) DEFAULT 'active'; 