import { Favorite, ProductVariation, Product } from '../models/index.js';

// Add to favorites
export const addToFavorites = async (req, res) => {
  try {
    const { user_id, product_variation_id } = req.body;

    const existing = await Favorite.findOne({
      where: { user_id, product_variation_id }
    });

    if (existing) {
      return res.status(400).json({ message: 'Item already in favorites' });
    }

    const favorite = await Favorite.create({
      user_id,
      product_variation_id
    });

    res.status(201).json(favorite);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's favorites
export const getFavorites = async (req, res) => {
  try {
    const { user_id } = req.params;

    const favorites = await Favorite.findAll({
      where: { user_id },
      include: [{
        model: ProductVariation,
        include: [{
          model: Product,
          as: 'product'
        }]
      }]
    });

    res.status(200).json(favorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove from favorites
export const removeFromFavorites = async (req, res) => {
  try {
    const { user_id, product_variation_id } = req.params;

    const deleted = await Favorite.destroy({
      where: { user_id, product_variation_id }
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    res.status(200).json({ message: 'Removed from favorites' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check if item is favorited
export const checkFavorite = async (req, res) => {
  try {
    const { user_id, product_variation_id } = req.params;

    const favorite = await Favorite.findOne({
      where: { user_id, product_variation_id }
    });

    res.status(200).json({ isFavorite: !!favorite });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
