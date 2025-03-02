import { User, Order, Review, Settings } from '../models/index.js';
import ApiResponse from '../utils/APIResponse.js';
import ApiError from '../utils/APIError.js';
import asyncWrapper from '../utils/asyncWrapper.js';

export const getUserProfile = asyncWrapper(async (req, res) => {
  const userId = req.userId; 

  const userProfile = await User.findOne({
    where: { id: userId },
    attributes: ['userName', 'email'],
  });

  if (!userProfile) {
    throw ApiError.notFound('User profile not found');
  }

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

  ApiResponse.success(res, "Profile retrieved successfully", profileData);
});

export const updateNotificationSettings = asyncWrapper(async (req, res) => {
  const userId = req.userId;
  const { salesNotification, newArrivalsNotification, deliveryStatusNotification } = req.body;

  // Validation
  const settingsToValidate = {
    salesNotification,
    newArrivalsNotification,
    deliveryStatusNotification
  };

  // Check if any setting is provided
  const hasAtLeastOneSetting = Object.values(settingsToValidate).some(value => value !== undefined);
  if (!hasAtLeastOneSetting) {
    throw ApiError.badRequest('At least one notification setting must be provided');
  }

  // Check if all provided settings are boolean
  for (const [key, value] of Object.entries(settingsToValidate)) {
    if (value !== undefined && typeof value !== 'boolean') {
      throw ApiError.badRequest(`${key} must be a boolean value`);
    }
  }

  // Find or create settings for the user
  const [settings, created] = await Settings.findOrCreate({
    where: { userId },
    defaults: {
      salesNotification: true,
      newArrivalsNotification: true,
      deliveryStatusNotification: true
    }
  });

  // Update only the provided settings
  const updates = {};
  if (salesNotification !== undefined) updates.salesNotification = salesNotification;
  if (newArrivalsNotification !== undefined) updates.newArrivalsNotification = newArrivalsNotification;
  if (deliveryStatusNotification !== undefined) updates.deliveryStatusNotification = deliveryStatusNotification;

  await settings.update(updates);

  const updatedSettings = await Settings.findOne({
    where: { userId },
    attributes: ['salesNotification', 'newArrivalsNotification', 'deliveryStatusNotification']
  });

  ApiResponse.success(res, "Notification settings updated successfully", updatedSettings);
});

export const getNotificationSettings = asyncWrapper(async (req, res) => {
  const userId = req.userId;

  const settings = await Settings.findOne({
    where: { userId },
    attributes: ['salesNotification', 'newArrivalsNotification', 'deliveryStatusNotification']
  });

  if (!settings) {
    throw ApiError.notFound('Notification settings not found');
  }

  ApiResponse.success(res, "Notification settings retrieved successfully", settings);
});