const express = require('express');
const { addStock, updateStock, removeStock } = require('../controllers/stockController');
const authenticateAdmin = require('../middleware/authenticateAdmin');

const router = express.Router();

// Dashboard endpoint to get all stocks
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const pool = require('../config/db');
    const result = await pool.query('SELECT * FROM stocks');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all stocks:', error);
    res.status(500).json({ error: 'Failed to fetch stocks' });
  }
});

// Public endpoint to get stocks for a specific store (for customers)
router.get('/public/stores/:storeId/stocks', async (req, res) => {
  try {
    const { storeId } = req.params;
    const pool = require('../config/db');
    const result = await pool.query('SELECT * FROM stocks WHERE store_id = $1', [storeId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching store stocks:', error);
    res.status(500).json({ error: 'Failed to fetch stocks' });
  }
});

// Admin endpoints for managing stocks
router.get('/stores/:storeId/stocks', authenticateAdmin, async (req, res) => {
  try {
    const { storeId } = req.params;
    const adminId = req.admin.id;
    const pool = require('../config/db');
    const result = await pool.query('SELECT * FROM stocks WHERE store_id = $1 AND admin_id = $2', [storeId, adminId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching store stocks:', error);
    res.status(500).json({ error: 'Failed to fetch stocks' });
  }
});

router.post('/stores/:storeId/stocks', authenticateAdmin, addStock);
router.put('/stores/:storeId/stocks/:id', authenticateAdmin, updateStock);
router.delete('/stores/:storeId/stocks/:id', authenticateAdmin, removeStock);

module.exports = router;
