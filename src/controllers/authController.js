import bcrypt from 'bcrypt';
import { User } from '../models/index.js';
import {
  generateAccessToken,
  generateRefreshToken,
} from '../utils/generateToken.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import ApiError from '../utils/APIError.js';
import ApiResponse from '../utils/APIResponse.js';

const createUser = asyncWrapper(async (req, res) => {
  const { userName, email, phoneNumber, password } = req.body;

  const existingUser = await User.findOne({
    where: {
      email,
    },
    attributes: ['id'],
  });
  console.log(existingUser);

  if (existingUser) {
    throw ApiError.badRequest('User already exists with this email');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    userName,
    email,
    phone_number: phoneNumber,
    password: hashedPassword,
  });
  console.log('hifehf');
  const accessToken = generateAccessToken(newUser.id);
  const refreshToken = generateRefreshToken(newUser.id);

  console.log(accessToken, refreshToken);

  ApiResponse.created(res, 'User created successfully', {
    accessToken,
    refreshToken,
  });

  const update = await User.update(
    {
      refresh_token: refreshToken,
    },
    {
      where: {
        id: newUser.id,
      },
    },
  );

  console.log(update);
});

const login = asyncWrapper(async (req, res) => {
  const { phoneNumber, password } = req.body;

  const user = await User.findOne({
    where: { phone_number: phoneNumber },
    attributes: ['id', 'password'],
  });

  if (!user) {
    throw ApiError.badRequest('Invalid credentials');
  }

  try {
    await bcrypt.compare(password, user.password);
  } catch (error) {
    throw ApiError.internal('Error verifying password');
  }
  console.log('ent');

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  ApiResponse.success(res, 'Login successful', {
    accessToken,
    refreshToken,
  });

  await User.update(
    {
      refresh_token: refreshToken,
    },
    {
      where: {
        id: user.id,
      },
    },
  );
});

const changePassword = asyncWrapper(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId;

  const user = await User.findByPk(userId, {
    attributes: ['id', 'password'],
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    throw ApiError.badRequest('Invalid current password');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedNewPassword = await bcrypt.hash(newPassword, salt);

  await user.update(
    {
      password: hashedNewPassword,
    },
    {
      where: {
        id: userId,
      },
    },
  );

  return ApiResponse.success(res, 'Password changed successfully');
});

export { createUser, login, changePassword };
