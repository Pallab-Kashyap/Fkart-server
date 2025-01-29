import bcrypt from 'bcrypt';
import { OTPVerification, User } from '../models/index.js';
import {
  generateAccessToken,
  generateOTP,
  generateRefreshToken,
} from '../utils/generateToken.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import ApiError from '../utils/APIError.js';
import ApiResponse from '../utils/APIResponse.js';
import { Op } from 'sequelize';
import sendOTP from '../utils/twilio.js';

const createUser = asyncWrapper(async (req, res) => {
  const { userName, email, phoneNumber, password } = req.body;

  if (!userName || !email || !phoneNumber || !password) {
    throw ApiError.badRequest(
      'userName, email, phoneNumber and password are required'
    );
  }

  const existingUser = await User.findOne({
    where: {
      [Op.or]: [
        { email: email },
        { phone_number: phoneNumber }
      ]
    },
    attributes: ['id'],
  });
  console.log(existingUser);

  if (existingUser) {
    throw ApiError.badRequest('User already exists with this email or phone number');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    userName,
    email,
    phone_number: phoneNumber,
    password: hashedPassword,
  });

  const OTP = generateOTP();
  const isOTPSent = await sendOTP(OTP, phoneNumber);

  if (!isOTPSent) {
    await user.destroy(); 
    throw ApiError.internal('Failed to send OTP');
  }

  await OTPVerification.create({
    user_id: user.id,
    otp_code: OTP,
    expiration_time: new Date(Date.now() + 10 * 60 * 1000), 
  });

  ApiResponse.created(res, `OTP has been sent to your mobile number`, {OTP});
});

const login = asyncWrapper(async (req, res) => {
  const { phoneNumber, password } = req.body;

  if (!phoneNumber || !password) {
    throw ApiError.badRequest('phoneNumber and password are required');
  }

  const user = await User.findOne({
    where: { phone_number: phoneNumber },
    attributes: ['id', 'password'],
  });

  if (!user) {
    throw ApiError.badRequest('Invalid credentials');
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw ApiError.badRequest('Invalid credentials');
  }
  const OTP = generateOTP();
  const isOTPSnet = await sendOTP(OTP, phoneNumber);

  if (!isOTPSnet) {
    throw ApiError.internal('Failed to send OTP');
  }

  await OTPVerification.create({
    user_id: user.id,
    otp_code: OTP,
    expiration_time: new Date(Date.now() + 10 * 60 * 1000), 
  });

  ApiResponse.created(res, `OTP has been sent to your mobile number`, {OTP});
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
      otp_code: OTP.toString(),
      is_verified: false
    }
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

  await OTPVerification.update(
    { is_verified: true },
    {
      where: {
        user_id: user.id,
        otp_code: OTP
      }
    }
  );

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  await User.update(
    { refresh_token: refreshToken },
    { where: { id: user.id } }
  );

  ApiResponse.success(res, 'OTP verified successfully', {
    accessToken,
    refreshToken
  });
});

const resendOTP = asyncWrapper(async (req, res) => {
  const { phoneNumber } = req.body;

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

  await OTPVerification.create({
    user_id: user.id,
    otp_code: OTP,
    expiration_time: new Date(Date.now() + 10 * 60 * 1000),
  }); 

  ApiResponse.created(res, `OTP has been sent to your mobile number`, {OTP});
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
    }
  );

  res.status(200).json({ message: 'Password updated successfully' });
});


export { createUser, login, changePassword, verifyOTP, resendOTP };
