-- Create password_setup_tokens table for admin password setup
CREATE TABLE IF NOT EXISTS password_setup_tokens (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_active_token UNIQUE (admin_id, token)
);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_password_setup_tokens_token ON password_setup_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_setup_tokens_admin_id ON password_setup_tokens(admin_id);
CREATE INDEX IF NOT EXISTS idx_password_setup_tokens_expires_at ON password_setup_tokens(expires_at); 