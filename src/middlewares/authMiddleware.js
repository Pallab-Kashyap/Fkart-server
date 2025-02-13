import ApiError from '../utils/APIError.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import { verifyToken } from '../utils/generateToken.js';

const auth = asyncWrapper(async (req, res, next) => {

  let token = req.header('Authorization');
  if (!token || !token.startsWith('Bearer')) {
    throw ApiError.unauthorized('Unauthorized, token is missing or not Bearer token');
  }

  token = token.split(' ')[1];
  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
  if (!accessTokenSecret) {
    throw ApiError.internal('Access token secret not found');
  }
  const userId = verifyToken(token, accessTokenSecret);

  if (!userId) {
    throw ApiError.unauthorized('Unauthorized');
  }

  req.userId = userId;
  next();
});

export default auth;

