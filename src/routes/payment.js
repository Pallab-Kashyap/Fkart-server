import express from 'express'
import { processWebhook, verifyPayment,  } from '../controllers/payment/razorpayPaymentController.js'

const router = express.Router();


router.post('/webhook', express.raw({ type: 'application/json' }), processWebhook); 
router.post('/verify-payment', verifyPayment)

module.exports = router;