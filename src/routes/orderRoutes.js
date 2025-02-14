import { Router } from 'express';
import { createOrder, 
    createOrderFromProduct,
     getOrder,
      getUserOrders 
    } from '../controllers/orderController.js';
import auth from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/cart-checkout', auth, createOrder);
router.post('/create-from-product', auth, createOrderFromProduct);
router.get('/:id', auth, getOrder);
router.get('/user/orders', auth, getUserOrders);

export default router;  