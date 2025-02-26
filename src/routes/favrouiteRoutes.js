import express from 'express';
import { 
  addToFavorites, 
  getFavorites, 
  removeFromFavorites, 
  checkFavorite 
} from '../controllers/favrouiteController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import auth from '../middlewares/authMiddleware.js';

const router = express.Router();



// Add to favorites
router.post('/', auth,addToFavorites);

// Get user's favorites
router.get('/',auth, getFavorites);

// Remove from favorites
router.delete('/:product_variation_id',auth, removeFromFavorites);

// Check if item is in favorites
router.get('/check/:product_variation_id', auth,checkFavorite);

export default router;
