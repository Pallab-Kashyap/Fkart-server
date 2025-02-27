import bcrypt from 'bcrypt';
import { OTPVerification, User } from '../models/index.js';
import {
  generateAccessToken,
  generateOTP,
  generateRefreshToken,
  verifyToken,
} from '../utils/generateToken.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import ApiError from '../utils/APIError.js';
import ApiResponse from '../utils/APIResponse.js';
import { Op } from 'sequelize';
import sendOTP from '../utils/twilio.js';
import { sequelize } from '../config/DBConfig.js';
import { createCart } from './CartController.js';

const createUser = asyncWrapper(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { userName, email, password, phoneNumber } = req.body;

    if (!userName || !email || !phoneNumber || !password) {
      throw ApiError.badRequest(
        'userName, email, phoneNumber and password are required'
      );
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { phone_number: phoneNumber }],
      },
      attributes: ['id'],
      raw: true,
    });

    if (existingUser) {
      throw ApiError.badRequest(
        'User already exists with this email or phone number'
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create(
      {
        userName,
        email,
        phone_number: phoneNumber,
        password: hashedPassword,
      },
      { transaction }
    );

    const OTP = generateOTP();

    const isOTPSent = await sendOTP(OTP, phoneNumber);

    if (!isOTPSent) {
      throw ApiError.internal('Failed to send OTP');
    }

    await Promise.all([
      OTPVerification.create(
        {
          user_id: user.id,
          otp_code: OTP,
          expiration_time: new Date(Date.now() + 10 * 60 * 1000),
        },
        { transaction }
      ),

      createCart(user.id, transaction),
    ]);

    await transaction.commit();

    ApiResponse.created(res, 'OTP has been sent to your mobile number', {
      OTP,
    });
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.internal(error?.message | 'Something went wrong');
  }
});

const login = asyncWrapper(async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      throw ApiError.badRequest('phoneNumber and password are required');
    }

    const user = await User.findOne({
      where: { phone_number: phoneNumber },
      attributes: ['id', 'password'],
    });

    if (!user) {
      throw ApiError.badRequest('User not found');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw ApiError.badRequest('Invalid credentials');
    }

    const OTP = generateOTP();
    const isOTPSent = await sendOTP(OTP, phoneNumber);

    if (!isOTPSent) {
      throw ApiError.internal('Failed to send OTP');
    }

    await OTPVerification.upsert(
      {
        user_id: user.id,
        otp_code: OTP,
        expiration_time: new Date(Date.now() + 10 * 60 * 1000),
        is_verified: false,
      },
      { transaction }
    );

    await transaction.commit();
    ApiResponse.success(res, 'OTP has been sent to your mobile number', {
      OTP,
    });
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.internal(error?.message || 'something went wrong');
  }
});

const verifyOTP = asyncWrapper(async (req, res) => {
  const { phoneNumber, OTP } = req.body;

  if (!phoneNumber || !OTP) {
    throw ApiError.badRequest('Phone number and OTP are required');
  }

  const user = await User.findOne({
    where: { phone_number: phoneNumber },
    attributes: ['id'],
  });

  if (!user) {
    throw ApiError.badRequest('User not found');
  }

  const otpRecord = await OTPVerification.findOne({
    where: {
      user_id: user.id,
      otp_code: OTP,
      is_verified: false,
    },
  });

  if (!otpRecord) {
    throw ApiError.badRequest('Invalid OTP');
  }

  if (otpRecord.created_at) {
    const otpAge = Date.now() - otpRecord.created_at.getTime();
    if (otpAge > 10 * 60 * 1000) {
      throw ApiError.badRequest('OTP has expired');
    }
  }

  const transaction = await sequelize.transaction();

  try {
    await OTPVerification.update(
      { is_verified: true },
      {
        where: {
          user_id: user.id,
          otp_code: OTP,
        },
      },
      { transaction }
    );

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await User.update(
      { refresh_token: refreshToken },
      { where: { id: user.id } },
      { transaction }
    );
    return ApiResponse.success(res, 'OTP verified successfully', {
      accessToken,
      refreshToken,
    });
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ApiError) {
      throw error;
    }

    throw ApiError.internal(error.message || 'Something went wrong');
  }
});

const resendOTP = asyncWrapper(async (req, res) => {
  const { phoneNumber } = req.body;
  const userId = req.userId;

  if (!phoneNumber) {
    throw ApiError.badRequest('Phone number is required');
  }

  const user = await User.findOne({
    where: { phone_number: phoneNumber },
    attributes: ['id'],
  });

  if (!user) {
    throw ApiError.badRequest('User not found');
  }

  const OTP = generateOTP();
  const isOTPSent = await sendOTP(OTP, phoneNumber);

  if (!isOTPSent) {
    throw ApiError.internal('Failed to send OTP');
  }

  await OTPVerification.update(
    {
      otp_code: OTP,
      expiration_time: new Date(Date.now() + 10 * 60 * 1000),
    },
    {
      where: {
        user_id: user.id,
        is_verified: false,
      },
    }
  );

  ApiResponse.created(res, 'OTP has been sent to your mobile number', { OTP });
});

const changePassword = asyncWrapper(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.userId;

  if (!currentPassword || !newPassword) {
    throw ApiError.badRequest('currentPassword and newPassword are required');
  }

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

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  await user.update(
    {
      password: hashedNewPassword,
    },
    {
      where: {
        id: userId,
      },
    }
  );

  return ApiResponse.success(res, 'Password changed successfully');
});

const refreshAccessToken = asyncWrapper(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw ApiError.badRequest('refreshToken is required');
  }
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

  if (!refreshTokenSecret) {
    throw ApiError.internal('Missing JWT secrets');
  }

  const userId = verifyToken(refreshToken, refreshTokenSecret);

  const user = await User.findOne({
    where: { refresh_token: refreshToken },
    attributes: ['id'],
  });

  if (!user || user.id !== userId) {
    throw ApiError.badRequest('Invalid refreshToken');
  }

  const accessToken = generateAccessToken(userId);

  return ApiResponse.success(res, '', { accessToken });
});

const logout = asyncWrapper(async (req, res) => {
  const userId = req.userId;

  await User.update(
    { refresh_token: null },
    {
      where: { id: userId },
    }
  );

  return ApiResponse.success(res, 'Logged out successfully');
});

export {
  createUser,
  login,
  changePassword,
  verifyOTP,
  resendOTP,
  refreshAccessToken,
  logout,
};
