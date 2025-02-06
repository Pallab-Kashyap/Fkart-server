import asyncWrapper from '../utils/asyncWrapper.js';
import ApiResponse from '../utils/APIResponse.js';
import Review from '../models/reviewModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';

// Create a new review
export const createReview = asyncWrapper(async (req, res) => {
  const userId = req.userId; 
  req.body.user_id = userId;
  const product = await Product.findByPk(req.body.product_id);
  if (!product) {
    return ApiResponse.notFound(res, 'Product not found');
  }
  const review = await Review.create(req.body);
  return ApiResponse.created(res, 'Review added successfully', review);
});

// Get all reviews for a product
export const getProductReviews = asyncWrapper(async (req, res) => {
  const { product_id } = req.params;

  // Check if the product exists
  const product = await Product.findByPk(product_id);
  if (!product) {
    return ApiResponse.notFound(res, 'Product not found');
  }

  const reviews = await Review.findAll({
    where: { product_id },
    include: [{ model: User, attributes: ['id', 'product_name'] }]
  });

  return ApiResponse.success(res, 'Reviews fetched successfully', reviews);
});

// Get all reviews by a user
export const getUserReviews = asyncWrapper(async (req, res) => {
  const userId = req.userId; // Get user ID from request

  const reviews = await Review.findAll({
    where: { user_id: userId },
    include: [{ model: Product, attributes: ['id', 'product_name'] }]
  });

  return ApiResponse.success(res, 'User reviews fetched successfully', reviews);
});

// Update a review
export const updateReview = asyncWrapper(async (req, res) => {
  const { review_id } = req.params;
  const userId = req.userId; // Get user ID from request

  const review = await Review.findOne({ where: { id: review_id, user_id: userId } });

  if (!review) {
    return ApiResponse.notFound(res, 'Review not found or not owned by user');
  }

  await review.update(req.body);
  return ApiResponse.success(res, 'Review updated successfully', review);
});

// Delete a review
export const deleteReview = asyncWrapper(async (req, res) => {
  const { review_id } = req.params;
  const userId = req.userId; // Get user ID from request

  const review = await Review.findOne({ where: { id: review_id, user_id: userId } });

  if (!review) {
    return ApiResponse.notFound(res, 'Review not found or not owned by user');
  }

  await review.destroy();
  return ApiResponse.success(res, 'Review deleted successfully');
});
