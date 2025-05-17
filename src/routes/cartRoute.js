import express from 'express';
const router = express.Router();

import {
  // createCartHandler,
  getCart,
  deleteCart,
  addItemToCart,
  updateCartItem,
  deleteCartItem,
  clearCart,
  calculateCartTotalPrice,
} from '../controllers/CartController.js'; 
import auth from '../middlewares/authMiddleware.js';

// CART ROUTES 
router.delete('/clear-cart', auth, clearCart); 
// router.post('/', auth, createCartHandler);
router.get('/', auth, getCart);
router.get('/:cart_id/totalprice', auth, calculateCartTotalPrice);
router.delete('/:id', auth, deleteCart);

// CART ITEM ROUTES
router.post('/item', auth, addItemToCart); 
router.put('/item/:id', auth, updateCartItem); 
router.delete('/item/:id', auth, deleteCartItem); 
 
export default router;