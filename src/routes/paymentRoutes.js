import express from 'express'
import { razorpayWebhook, verifyPayment,  } from '../controllers/payment/razorpayPaymentController.js'

const router = express.Router();


router.post('/razorpay-webhook', express.raw({ type: 'application/json' }), razorpayWebhook); 
router.post('/verify-payment', verifyPayment)

export default router;