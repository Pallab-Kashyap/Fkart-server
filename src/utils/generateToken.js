import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import ApiError from './APIError.js';

dotenv.config();

if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
  throw new ApiError(500, 'Missing JWT secrets');
}

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  });
};

const generateToken = (data, expiry) => {
  return jwt.sign(data, process.env.ACCESS_TOKEN_SECRET, {
    algorithm: 'HS256',
    expiresIn: expiry || process.env.ACCESS_TOKEN_EXPIRES_IN,
  });
};

const verifyToken = (token, secret) => {
  try {
    const { userId } = jwt.verify(token, secret, { algorithms: ['HS256'] });
    return userId;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.custom(401, 'Token expired');
    }
    throw ApiError.custom(401, 'Invalid token');
  }
};

const generateOTP = () => {
  return String(Math.floor(100000 + Math.random() * 900000));
};

export {
  generateAccessToken,
  generateRefreshToken,
  generateToken,
  verifyToken,
  generateOTP,
};
