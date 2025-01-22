// import express from 'express';
// import auth from '../middlewares/authMiddleware.js';
// import {
//   getCart,
//   addItemToCart,
//   updateCartItem,
//   removeItemFromCart,
//   clearCart,
// } from '../controllers/CartController.js';

// const router = express.Router();

// router.get('/cart', getCart); // Get the cart
// router.post('/cart/items', addItemToCart); // Add item to cart
// router.put('/cart/items/:id', updateCartItem); // Update cart item
// router.delete('/cart/items/:id', removeItemFromCart); // Remove item from cart
// router.delete('/cart', clearCart); // Clear the entire cart

// export default router;

import express from 'express';
const router = express.Router();

import {
  createCart,
  getCart,
  // deleteCart,
  // addItemToCart,
  // updateCartItem,
  // deleteCartItem,
  // clearCart,
  calculateTotalPrice, 
} from '../controllers/CartController.js'; 
import auth from '../middlewares/authMiddleware.js';

// CART ROUTES
router.post('/', auth, createCart); 
router.get('/:user_id', auth, getCart); 
// router.delete('/:id', auth, deleteCart); 

// // CART ITEM ROUTES
// router.post('/item', auth, addItemToCart); // 
// router.put('/item/:id', auth, updateCartItem); // 
// router.delete('/item/:id', auth, deleteCartItem); // 

// // ADDITIONAL ROUTES
// router.delete('/:cart_id/items', auth, clearCart); // 
router.get('/:cart_id/totalprice', auth, calculateTotalPrice); 
export default router;
