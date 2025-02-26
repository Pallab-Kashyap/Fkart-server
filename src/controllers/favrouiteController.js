import { Favorite, ProductVariation, Product } from '../models/index.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import ApiResponse from '../utils/APIResponse.js';
import ApiError from '../utils/APIError.js';

export const addToFavorites = asyncWrapper(async (req, res) => {
  const { product_variation_id } = req.body;
  const user_id = req.userId;

  const existing = await Favorite.findOne({
    where: { user_id, product_variation_id }
  });

  if (existing) {
    throw ApiError.badRequest('Item already in favorites');
  }

  const favorite = await Favorite.create({
    user_id,
    product_variation_id
  });

  return ApiResponse.success(res, 'Added to favorites successfully', favorite);
});

export const getFavorites = asyncWrapper(async (req, res) => {
  const user_id = req.userId;

  const favorites = await Favorite.findAll({
    where: { user_id },
    include: [{
      model: ProductVariation,
      include: [{
        model: Product,
        as: 'product',
        attributes: ['id', 'product_name', 'image_url']
      }],
      attributes: ['id', 'size', 'color', 'price']
    }]
  });

  return ApiResponse.success(res, 'Favorites retrieved successfully', favorites);
});

export const removeFromFavorites = asyncWrapper(async (req, res) => {
  const { product_variation_id } = req.params;
  const user_id = req.userId;

  const deleted = await Favorite.destroy({
    where: { user_id, product_variation_id }
  });

  if (!deleted) {
    throw ApiError.notFound('Favorite not found');
  }

  return ApiResponse.success(res, 'Removed from favorites successfully');
});

export const checkFavorite = asyncWrapper(async (req, res) => {
  const { product_variation_id } = req.params;
  const user_id = req.userId;

  const favorite = await Favorite.findOne({
    where: { user_id, product_variation_id }
  });

  return ApiResponse.success(res, 'Favorite status retrieved', { isFavorite: !!favorite });
});
