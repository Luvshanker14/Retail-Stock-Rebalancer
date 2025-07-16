const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const authenticateAdmin = require('../middleware/authenticateAdmin');

router.get('/tracked', authenticateAdmin, storeController.getTrackedStores);
router.get('/location/:location', storeController.getStoresByLocation); // 👈 move this up
router.get('/search', storeController.searchStores); // Case-insensitive search endpoint
router.get('/', storeController.getStores);
router.post('/', authenticateAdmin, storeController.createStore);
router.put('/:id', authenticateAdmin, storeController.updateStore);
router.delete('/:id', authenticateAdmin, storeController.deleteStore);
router.get('/:id', authenticateAdmin, storeController.getStore);
router.post('/:storeId/track', authenticateAdmin, storeController.trackStore);

module.exports = router;
