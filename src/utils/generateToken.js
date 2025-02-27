import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import ApiError from './APIError.js';

dotenv.config();

const checkENV = () => {
  if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw ApiError.internal('Missing JWT secrets');
  }
  return
};

const generateAccessToken = (userId) => {
  checkENV()
  return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1d',
  });
};

const generateRefreshToken = (userId) => {
  checkENV()
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    algorithm: 'HS256',
    expiresIn: '15d',
  });
};

const generateToken = (data, expiry) => {
  checkENV()
  return jwt.sign(data, process.env.ACCESS_TOKEN_SECRET, {
    algorithm: 'HS256',
    expiresIn: expiry || '1d',
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
