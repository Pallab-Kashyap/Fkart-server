import ApiError from '../utils/APIError.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import { verifyToken } from '../utils/generateToken.js';

const auth = asyncWrapper(async (req, res, next) => {
  console.log(req.header('Authorization'));
  let token = req.header('Authorization');
  if (!token || !token.startsWith('Bearer')) {
    throw ApiError.unauthorized('Unauthorized');
  }

  token = token.split(' ')[1];
  const { userId } = verifyToken(token, process.env.ACCESS_TOKEN_SECRET);

  if (!userId) {
    throw ApiError.unauthorized('Unauthorized');
  }

  req.userId = userId;
  next();
});

export default auth;
