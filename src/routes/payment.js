import express from 'express'
import { createOrder, processWebhook, getPaymentStatus } from '../controllers/paymentController'

const router = express.Router();

router.post('/create-order', createOrder);
router.post('/webhook', express.raw({ type: 'application/json' }), processWebhook); 
router.get('/status/:id', getPaymentStatus);

module.exports = router;