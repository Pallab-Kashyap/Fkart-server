import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import ApiError from './APIError.js';

dotenv.config();

const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.ACCESS_TOKEN_SECRET,  
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN } 
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },  
    process.env.REFRESH_TOKEN_SECRET, 
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN } 
  );
};

const generateToken = (data, expiry) => {
  return jwt.sign(
    data,
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: expiry || process.env.ACCESS_TOKEN_EXPIRES_IN }
  )
};

const verifyToken = (token, secret) => { 
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        throw ApiError.custom(401, 'Ivalid token or token expired');
    }
}

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

export { generateAccessToken, generateRefreshToken, generateToken, verifyToken, generateOTP };
