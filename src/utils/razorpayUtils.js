import Razorpay from 'razorpay';
import crypto from 'crypto' 
import config from '../config/razorpayConfig.js'


const razorpayInstance = new Razorpay({
    key_id: config.razorpay.key_id,
    key_secret: config.razorpay.key_secret,
});

const verifyWebhookSignature = (requestBody, signature) => {
    const expectedSignature = crypto.HmacSHA256(requestBody, config.razorpay.webhook_secret).toString();
    return expectedSignature === signature;
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


export {
    razorpayInstance,
    verifyWebhookSignature,
    refundPayment,
};