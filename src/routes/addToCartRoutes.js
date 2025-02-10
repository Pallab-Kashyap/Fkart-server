import express from 'express';
const router = express.Router();

import {
  createCart,
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
router.post('/', auth, createCart); 
router.get('/', auth, getCart); 
router.delete('/:id', auth, deleteCart); 
router.get('/:cart_id/totalprice', auth, calculateCartTotalPrice);

// CART ITEM ROUTES
router.post('/item', auth, addItemToCart); 
router.put('/item/:id', auth, updateCartItem); 
router.delete('/item/:id', auth, deleteCartItem); 

// ADDITIONAL ROUTES
router.delete('/:cart_id/items', auth, clearCart); // 
 
export default router;
