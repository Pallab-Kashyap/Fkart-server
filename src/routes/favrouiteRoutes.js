import express from 'express';
import {
  addToFavorites,
  getFavorites,
  removeFromFavorites,
} from '../controllers/favrouiteController.js';

import auth from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', auth, addToFavorites);

router.get('/', auth, getFavorites);

router.delete('/:product_variation_id', auth, removeFromFavorites);

export default router;
