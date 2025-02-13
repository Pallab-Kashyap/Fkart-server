import Razorpay from 'razorpay';
import crypto from 'crypto-js' 
import config from '../config/razorpayConfig'
import ApiError from './APIError';

const razorpayInstance = new Razorpay({
    key_id: config.razorpay.key_id,
    key_secret: config.razorpay.key_secret,
});

const verifyWebhookSignature = (requestBody, signature) => {
    const expectedSignature = crypto.HmacSHA256(requestBody, config.razorpay.webhook_secret).toString();
    return expectedSignature === signature;
};

const createRazorpayOrder = async (amount, currency, receipt) => {
    try {
        const order = await razorpayInstance.orders.create({
            amount, 
            currency,
            receipt
        });
        return order;
    } catch (error) {
        console.error("Error creating Razorpay order:", error);
        throw ApiError.internal(`Error creating Razorpay order: ${error}`)
    }
};

const refundPayment = async (paymentId, amount, reason = 'Delayed Payment - Fast Refund') => {
    try {
        const refund = await razorpayInstance.payments.refund(paymentId, {
            amount: amount, 
            // reason: reason,
        });
        return refund;
    } catch (error) {
        console.error("Error initiating refund:", error);
        throw error;
    }
};


module.exports = {
    razorpayInstance,
    verifyWebhookSignature,
    createRazorpayOrder,
    refundPayment,
};