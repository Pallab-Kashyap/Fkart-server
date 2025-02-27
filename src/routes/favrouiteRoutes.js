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

// Remove from favorites
router.delete('/:product_variation_id',auth, removeFromFavorites);

// Check if item is in favorites
// router.get('/check/:product_variation_id', auth,checkFavorite);

export default router;
