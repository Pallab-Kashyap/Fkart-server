import { Favorite, ProductVariation, Product } from '../models/index.js';
import ApiError from '../utils/APIError.js';
import ApiResponse from '../utils/APIResponse.js';
import asyncWrapper from '../utils/asyncWrapper.js';

// Add to favorites
export const addToFavorites = asyncWrapper( async (req, res) => {

    const { product_variation_id } = req.body;
    const user_id = req.userId
    const existing = await Favorite.findOne({
      where: { user_id, product_variation_id }
    });

    if (existing) {
      throw ApiError.badRequest('Item already in favorites' )
    }

    await Favorite.create({
      user_id,
      product_variation_id
    });

    return ApiResponse.created('Add to favorite')

})

// Get user's favorites
export const getFavorites = asyncWrapper (async (req, res) => {

    const user_id = req.userId

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

    return ApiResponse.success(res, '', favorites)

});

// Remove from favorites
export const removeFromFavorites = asyncWrapper (async (req, res) => {

    const { product_variation_id } = req.params;
    const user_id = req.userId

    const deleted = await Favorite.destroy({
      where: { user_id, product_variation_id }
    });

    if (!deleted) {
      throw ApiError.badRequest('Favorite not found')
    }

    return ApiResponse.success(res, 'Favorite removed successfully')

});


