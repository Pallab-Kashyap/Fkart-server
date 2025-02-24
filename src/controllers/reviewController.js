import asyncWrapper from '../utils/asyncWrapper.js';
import ApiResponse from '../utils/APIResponse.js';
import ApiError from '../utils/APIError.js';
import { Review, Order, OrderItem, Product, User, ProductVariation } from '../models/index.js';
import { sequelize } from '../config/DBConfig.js';
import { ORDER_STATUS } from '../constants.js';

// Input validation middleware
const validateReviewInput = (req, res, next) => {
  const { product_id, rating, comment } = req.body;
  if (!product_id || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw ApiError.badRequest("Invalid review input: product_id and rating (1-5) are required");
  }
  next();
};

//create Review
export const createReview = asyncWrapper(async (req, res) => {
  const { userId, body: { orderItemId, orderId, comment, rating } } = req;

  if (!orderItemId || !orderId || !rating || rating < 1 || rating > 5) {
    throw ApiError.badRequest('Invalid input. Required: orderItemId, orderId, and rating (1-5)');
  }

  // Check for existing review
  const existingReview = await Review.findOne({
    where: {
      order_id: orderId,
      user_id: userId,
      order_item_id: orderItemId,
    }
  });

  if (existingReview) {
    throw ApiError.badRequest('You have already reviewed this order item');
  }

  // Verify order and order item
  const order = await Order.findOne({
    where: {
      id: orderId,
      user_id: userId,
      order_status: ORDER_STATUS.DELIVERED
    },
    include: [{
      model: OrderItem,
      as: "OrderItems",
      where: { id: orderItemId },
      include: [{
        model: ProductVariation,
        as: "product_variation",
        include: [{
          model: Product,
          as: "product",
        }]
      }]
    }]
  });

  if (!order) {
    throw ApiError.notFound('Order not found or not eligible for review');
  }

  if (!order.OrderItems?.length) {
    throw ApiError.notFound('Order item not found');
  }

  const orderItem = order.OrderItems[0];
  const newReview = await Review.create({
    user_id: userId,
    product_variation_id: orderItem.product_variation.id,
    product_id: orderItem.product_variation.product.id,
    order_id: orderId,
    order_item_id: orderItemId,
    comment,
    rating
  });

  return ApiResponse.created(res, 'Review created successfully', newReview);
});

// Get all reviews with statistics
export const getAllReviews = asyncWrapper(async (req, res) => {
  const { product_id } = req.params;

  const [reviews, stats] = await Promise.all([
    Review.findAll({
      where: { product_id },
      include: [{
        model: User,
        attributes: ['id', 'userName']
      }],
      attributes: ['id', 'rating', 'comment', 'createdAt']
    }),
    Review.findOne({
      where: { product_id },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews'],
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
        [sequelize.literal('SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END)'), 'oneStar'],
        [sequelize.literal('SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END)'), 'twoStar'],
        [sequelize.literal('SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END)'), 'threeStar'],
        [sequelize.literal('SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END)'), 'fourStar'],
        [sequelize.literal('SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END)'), 'fiveStar']
      ],
      raw: true
    })
  ]);

  const responseData = {
    reviews: reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      user: {
        id: review.User.id,
        name: review.User.userName
      }
    })),
    statistics: stats ? {
      totalReviews: parseInt(stats.totalReviews) || 0,
      averageRating: parseFloat(stats.averageRating).toFixed(1) || "0.0",
      ratingDistribution: {
        1: parseInt(stats.oneStar) || 0,
        2: parseInt(stats.twoStar) || 0,
        3: parseInt(stats.threeStar) || 0,
        4: parseInt(stats.fourStar) || 0,
        5: parseInt(stats.fiveStar) || 0
      }
    } : {
      totalReviews: 0,
      averageRating: "0.0",
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    }
  };

  return ApiResponse.success(res, "Reviews retrieved successfully", responseData);
});

// Update a review
export const updateReview = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  const { rating, comment } = req.body;

  const review = await Review.findOne({
    where: { 
      id, 
      user_id: userId 
    },
    attributes: ['id', 'rating', 'comment']
  });

  if (!review) {
    throw ApiError.notFound("Review not found or you don't have permission to update it");
  }

  await review.update({ 
    rating: rating || review.rating, 
    comment: comment || review.comment 
  });

  return ApiResponse.success(res, "Review updated successfully", {
    id: review.id,
    rating: review.rating,
    comment: review.comment
  });
});

// Get user's reviews
export const getUserReviews = asyncWrapper(async (req, res) => {
  const userId = req.userId;

  const reviews = await Review.findAll({
    where: { user_id: userId },
    include: [{
      model: Product,
      attributes: ['id', 'product_name']
    }],
    attributes: ['id', 'product_id', 'rating', 'comment', 'createdAt']
  });

  return ApiResponse.success(res, "User reviews retrieved successfully",
    reviews.map(review => ({
      id: review.id,
      product_id: review.product_id,
      product_name: review.Product.product_name,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt
    }))
  );
});

// Delete a review
export const deleteReview = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const deleted = await Review.destroy({
    where: { 
      id, 
      user_id: userId 
    }
  });

  if (!deleted) {
    throw ApiError.notFound("Review not found or you don't have permission to delete it");
  }

  return ApiResponse.success(res, "Review deleted successfully");
});

export default {
  createReview: [validateReviewInput, createReview],
  getAllReviews,
  updateReview: [validateReviewInput, updateReview],
  getUserReviews,
  deleteReview
};