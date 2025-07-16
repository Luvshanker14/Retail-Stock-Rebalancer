const recommendationModel = require('../models/recommendationModel');
const purchaseModel = require('../models/purchaseModel');

// Get personalized recommendations for customer
async function getPersonalizedRecommendations(req, res) {
  const customerId = req.customer.id;
  const { limit = 10 } = req.query;

  try {
    const recommendations = await recommendationModel.getPersonalizedRecommendations(customerId, parseInt(limit));
    res.json({ recommendations });
  } catch (error) {
    console.error('Error fetching personalized recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
}

// Get trending products
async function getTrendingProducts(req, res) {
  const { limit = 10 } = req.query;

  try {
    const trendingProducts = await recommendationModel.getTrendingProducts(parseInt(limit));
    res.json({ trendingProducts });
  } catch (error) {
    console.error('Error fetching trending products:', error);
    res.status(500).json({ error: 'Failed to fetch trending products' });
  }
}

// Get collaborative recommendations
async function getCollaborativeRecommendations(req, res) {
  const customerId = req.customer.id;
  const { limit = 10 } = req.query;

  try {
    const recommendations = await recommendationModel.getCollaborativeRecommendations(customerId, parseInt(limit));
    res.json({ recommendations });
  } catch (error) {
    console.error('Error fetching collaborative recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch collaborative recommendations' });
  }
}

// Get category-based recommendations
async function getCategoryRecommendations(req, res) {
  const { category } = req.params;
  const { limit = 10 } = req.query;

  try {
    const recommendations = await recommendationModel.getCategoryRecommendations(category, parseInt(limit));
    res.json({ recommendations });
  } catch (error) {
    console.error('Error fetching category recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch category recommendations' });
  }
}

// Get location-based recommendations
async function getLocationRecommendations(req, res) {
  const { location } = req.params;
  const { limit = 10 } = req.query;

  try {
    const recommendations = await recommendationModel.getLocationRecommendations(location, parseInt(limit));
    res.json({ recommendations });
  } catch (error) {
    console.error('Error fetching location recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch location recommendations' });
  }
}

// Get customer's favorite categories
async function getFavoriteCategories(req, res) {
  const customerId = req.customer.id;
  const { limit = 5 } = req.query;

  try {
    const favoriteCategories = await purchaseModel.getFavoriteCategories(customerId, parseInt(limit));
    res.json({ favoriteCategories });
  } catch (error) {
    console.error('Error fetching favorite categories:', error);
    res.status(500).json({ error: 'Failed to fetch favorite categories' });
  }
}

// Get customer's favorite stores
async function getFavoriteStores(req, res) {
  const customerId = req.customer.id;
  const { limit = 5 } = req.query;

  try {
    const favoriteStores = await purchaseModel.getFavoriteStores(customerId, parseInt(limit));
    res.json({ favoriteStores });
  } catch (error) {
    console.error('Error fetching favorite stores:', error);
    res.status(500).json({ error: 'Failed to fetch favorite stores' });
  }
}

// Get all recommendations (combined)
async function getAllRecommendations(req, res) {
  const customerId = req.customer.id;
  const { limit = 5 } = req.query;

  try {
    const [
      personalized,
      trending,
      collaborative,
      favoriteCategories,
      favoriteStores
    ] = await Promise.all([
      recommendationModel.getPersonalizedRecommendations(customerId, parseInt(limit)),
      recommendationModel.getTrendingProducts(parseInt(limit)),
      recommendationModel.getCollaborativeRecommendations(customerId, parseInt(limit)),
      purchaseModel.getFavoriteCategories(customerId, 3),
      purchaseModel.getFavoriteStores(customerId, 3)
    ]);

    res.json({
      personalized,
      trending,
      collaborative,
      favoriteCategories,
      favoriteStores
    });
  } catch (error) {
    console.error('Error fetching all recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
}

module.exports = {
  getPersonalizedRecommendations,
  getTrendingProducts,
  getCollaborativeRecommendations,
  getCategoryRecommendations,
  getLocationRecommendations,
  getFavoriteCategories,
  getFavoriteStores,
  getAllRecommendations
}; 