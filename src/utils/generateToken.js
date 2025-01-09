import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

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
        return null
    }
}

export { generateAccessToken, generateRefreshToken, generateToken, verifyToken };
