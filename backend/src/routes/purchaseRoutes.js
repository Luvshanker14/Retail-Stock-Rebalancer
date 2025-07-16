const express = require('express');
const router = express.Router();
const { purchaseStock } = require('../controllers/purchaseController');
const razorpay = require('../services/rasorpayService');
const authenticateCustomer = require('../middleware/authenticateCustomer');

router.post('/stores/:storeId/create-order', async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: 'INR',
      receipt: `order_rcptid_${Date.now()}`,
    });

    res.json(order);
  } catch (err) {
    console.error('❌ Razorpay error:', err);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
});
// router.post('/purchase', purchaseStock);
router.post('/stores/:storeId/purchase', authenticateCustomer, purchaseStock);

module.exports = router;