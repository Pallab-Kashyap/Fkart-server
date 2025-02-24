import { User, Order, Review } from '../models/index.js';
import ApiResponse from '../utils/APIResponse.js';
import asyncWrapper from '../utils/asyncWrapper.js';

export const getUserProfile = asyncWrapper(async (req, res) => {
  const userId = req.userId; // Changed from req.user.id to req.userId to match your auth pattern

  const userProfile = await User.findOne({
    where: { id: userId },
    attributes: ['userName', 'email'],
  });

  if (!userProfile) {
    return ApiResponse.notFound(res, "User profile not found");
  }

  // Get counts separately
  const [orderCount, reviewCount] = await Promise.all([
    Order.count({ where: { user_id: userId } }),
    Review.count({ where: { user_id: userId } })
  ]);

  const profileData = {
    userName: userProfile.userName,
    email: userProfile.email,
    statistics: {
      totalOrders: orderCount,
      totalReviews: reviewCount
    }
  };

  return ApiResponse.success(res, "Profile retrieved successfully", profileData);
});