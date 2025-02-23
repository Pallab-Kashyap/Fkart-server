import { Router } from 'express';
import {
  cartCheckout,
  getOrder,
  cancelOrder,
  returnOrder,
  createOrderFromProduct,
  getOrderDetails,
} from '../controllers/orderController.js';
import auth from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/cart-checkout', auth, cartCheckout);
router.post('/create-from-product', auth, createOrderFromProduct);
router.get('/:status', auth, getOrder);
router.get('/details/:orderId', auth, getOrderDetails);
router.post('/:orderId/cancel', auth, cancelOrder);
router.post('/:orderId/return', auth, returnOrder);

export default router;
