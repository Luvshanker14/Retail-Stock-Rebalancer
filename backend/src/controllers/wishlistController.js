const wishlistModel = require('../models/wishlistModel');

// Add item to wishlist
async function addToWishlist(req, res) {
  const { stockId, storeId } = req.body;
  const customerId = req.customer.id;

  if (!stockId || !storeId) {
    return res.status(400).json({ error: 'Stock ID and Store ID are required' });
  }

  try {
    const wishlistItem = await wishlistModel.addToWishlist(customerId, stockId, storeId);
    res.status(201).json({ 
      message: 'Item added to wishlist successfully',
      wishlistItem 
    });
  } catch (error) {
    if (error.message === 'Item already in wishlist') {
      return res.status(409).json({ error: 'Item is already in your wishlist' });
    }
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ error: 'Failed to add item to wishlist' });
  }
}

// Remove item from wishlist
async function removeFromWishlist(req, res) {
  const { stockId } = req.params;
  const customerId = req.customer.id;

  try {
    const removedItem = await wishlistModel.removeFromWishlist(customerId, stockId);
    if (!removedItem) {
      return res.status(404).json({ error: 'Item not found in wishlist' });
    }
    res.json({ 
      message: 'Item removed from wishlist successfully',
      removedItem 
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ error: 'Failed to remove item from wishlist' });
  }
}

// Get customer's wishlist
async function getWishlist(req, res) {
  const customerId = req.customer.id;

  try {
    const wishlist = await wishlistModel.getWishlist(customerId);
    res.json({ wishlist });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
}

// Check if item is in wishlist
async function checkWishlistStatus(req, res) {
  const { stockId } = req.params;
  const customerId = req.customer.id;

  try {
    const isInWishlist = await wishlistModel.isInWishlist(customerId, stockId);
    res.json({ isInWishlist });
  } catch (error) {
    console.error('Error checking wishlist status:', error);
    res.status(500).json({ error: 'Failed to check wishlist status' });
  }
}

// Get wishlist count
async function getWishlistCount(req, res) {
  const customerId = req.customer.id;

  try {
    const count = await wishlistModel.getWishlistCount(customerId);
    res.json({ count });
  } catch (error) {
    console.error('Error fetching wishlist count:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist count' });
  }
}

module.exports = {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  checkWishlistStatus,
  getWishlistCount
}; 