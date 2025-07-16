const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'retaildb',
  password: process.env.DB_PASSWORD || '12345678',
  port: process.env.DB_PORT || 5432,
});

async function setupCustomerFeatures() {
  try {
    console.log('🔄 Setting up customer features...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'customer_features_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // Execute each statement individually
    for (const statement of statements) {
      try {
        if (statement.trim()) {
          await pool.query(statement);
        }
      } catch (error) {
        // Handle specific errors for existing objects
        if (error.code === '42P07') { // duplicate_table
          console.log('ℹ️  Table already exists, skipping...');
        } else if (error.code === '42710') { // duplicate_object (trigger, function, etc.)
          console.log('ℹ️  Object already exists, skipping...');
        } else if (error.code === '42723') { // duplicate_function
          console.log('ℹ️  Function already exists, skipping...');
        } else if (error.code === '42712') { // duplicate_alias
          console.log('ℹ️  View already exists, skipping...');
        } else {
          console.error('❌ Error executing statement:', error.message);
          throw error;
        }
      }
    }
    
    console.log('✅ Customer features database schema setup completed!');
    console.log('📋 Tables and objects:');
    console.log('   - customer_wishlist');
    console.log('   - customer_purchases');
    console.log('   - customer_preferences');
    console.log('   - Views: customer_purchase_stats, product_popularity');
    console.log('   - Functions and triggers');
    
  } catch (error) {
    console.error('❌ Error setting up customer features:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the setup
setupCustomerFeatures()
  .then(() => {
    console.log('🎉 Customer features setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }); 