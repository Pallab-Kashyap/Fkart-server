import Address from '../models/userAddress.js';
import { sequelize } from '../config/DBConfig.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import ApiResponse from '../utils/APIResponse.js';
import ApiError from '../utils/APIError.js';

// create a nwe address
export const createAddress = asyncWrapper(async (req, res) => {
  const userId = req.userId;
  req.body.user_id = userId;
  const existingAddresses = await Address.findAll({
    where: { user_id: userId },
    attributes: { exclude: ['user_id', 'createdAt', 'updatedAt'] },
  });
  if (existingAddresses.length === 0) {
    req.body.isDefault = true;
  }
  // Create the new address
  const address = await Address.create(req.body);
  const addressData = address.toJSON();

  delete addressData.user_id;
  delete addressData.isDeleted;

  return ApiResponse.created(res, 'Address created successfully', addressData);
});

//get address
export const getAddresses = asyncWrapper(async (req, res) => {
  const userId = req.userId;
  const addresses = await Address.findAll({
    where: {
      user_id: userId,
      isDeleted: false,
    },
    attributes: { exclude: ['user_id', 'isDeleted'] },
  });
  return ApiResponse.success(res, 'Addresses fetched successfully', addresses);
});
// get addresses
export const updateAddress = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const [updated, updatedAddress] = await Address.update(req.body, { where: { id }, returning: true, attributes: { exclude: ['user_id', 'isDeleted']} });
  if (!updated) {
    throw ApiError.badRequest('Address not found');
  }
  // const updatedAddress = await Address.findByPk(id);
  return ApiResponse.success(
    res,
    'Address updated successfully',
    updatedAddress[0]
  );
});

// DElete adddress
export const deleteAddress = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const updated = await Address.update(
    { isDeleted: true },
    { where: { id, user_id: userId } }
  );

  if (updated[0] > 0) {
    return ApiResponse.success(res, 'Address deleted successfully');
  } else {
    return ApiResponse.notFound(res, 'Address not found');
  }
});

// set default address
export const setDefaultAddress = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  await sequelize.transaction(async (t) => {
    // Update the previous default address to false for the current user
    await Address.update(
      { isDefault: false },
      { where: { user_id: userId, isDefault: true }, transaction: t }
    );
    // Set the new address as default
    const [affectedRows] = await Address.update(
      { isDefault: true },
      { where: { id, user_id: userId }, transaction: t }
    );

    if (affectedRows === 0) {
      throw ApiError.badRequest('Address not found or does not belong to user');
    }
  });

  return ApiResponse.success(res, 'Default address updated successfully');
});
