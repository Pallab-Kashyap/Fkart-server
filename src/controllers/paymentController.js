import{ createRazorpayOrder, verifyWebhookSignature, refundPayment } from '../utils/razorpayUtils'
import Payment from '../models/payment'
import crypto from 'crypto'
import config from '../config/config'
import ApiError from '../utils/APIError';
import asyncWrapper from '../utils/asyncWrapper';
import ApiResponse from '../utils/ApiResponse';
import { Order } from '../models';

const checkOut = asyncWrapper (  async (req, res) => {

})


const verifyPayment = asyncWrapper( async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw ApiError.badRequest("Missing payment verification details.");
    }


        const generatedSignature = crypto.createHmac('sha256', config.razorpay.key_secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature === razorpay_signature) {

            const paymentRecord = await Payment.findOne({ where: { razorpayOrderId: razorpay_order_id } });

            if (!paymentRecord) {
                throw ApiError.badRequest("Payment record not found for Razorpay Order ID: " + razorpay_order_id );
            }

            await paymentRecord.update({
                razorpayPaymentId: razorpay_payment_id, 
                status: 'signature_verified', 
            });


            return ApiResponse.success(res, "Payment signature verification successful." );

        } else {

            console.warn("Payment signature verification failed for order:", razorpay_order_id);
            throw ApiError.badRequest("Payment signature verification failed. Signatures do not match.");
        }
})


const processWebhook = async (req, res) => {

    const webhookSignature = req.headers['x-razorpay-signature'];
    const requestBody = JSON.stringify(req.body);

    if (!verifyWebhookSignature(requestBody, webhookSignature)) {
        return res.status(400).json({ error: "Webhook signature verification failed" });
    }

    const event = req.body;
    const eventType = event.event;
    const paymentPayload = event.payload.payment;

    try {
        const razorpayPaymentId = paymentPayload.entity.id;
        const paymentStatus = paymentPayload.entity.status;
        const razorpayOrderId = paymentPayload.entity.order_id;
        const paymentAmount = paymentPayload.entity.amount;
        const paymentCurrency = paymentPayload.entity.currency;

        const paymentRecord = await Payment.findOne({ where: { razorpayOrderId: razorpayOrderId } });

        if (!paymentRecord) {
            return res.status(404).json({ error: "Payment record not found for Razorpay Order ID: " + razorpayOrderId });
        }

        let updatedStatus = paymentStatus;
        let refundInitiated = false;

        if (eventType === 'payment.captured') {
            updatedStatus = 'captured';
        } else if (eventType === 'payment.failed') {
            updatedStatus = 'failed';
        } else if (eventType === 'payment.authorized') {
            updatedStatus = 'authorized';
        } else if (eventType === 'payment.error') {
            updatedStatus = 'error';
        } else if (eventType === 'refund.initiated' || eventType === 'refund.processed' || eventType === 'refund.failed') {
            console.log(`Refund Event: ${eventType} for payment ${razorpayPaymentId}`);
            return res.status(200).json({ status: 'Webhook received and processed refund event' });
        } else {
            console.log(`Unhandled Webhook Event: ${eventType}`);
            return res.status(200).json({ status: 'Webhook received - unhandled event' });
        }


        // Delayed Payment/Authorization Logic and Fast Refund (same as before)
        const delayedStatuses = ['authorized', 'pending'];
        if (delayedStatuses.includes(paymentStatus) && eventType !== 'payment.captured' && eventType !== 'payment.failed' && eventType !== 'payment.error' ) {
            console.log(`Detected delayed status: ${paymentStatus} for payment ${razorpayPaymentId}. Initiating fast refund.`);
            try {
                if (!paymentRecord.isRefundedForDelay) {
                    await refundPayment(razorpayPaymentId, paymentAmount);
                    await paymentRecord.update({ status: 'refunded', refundDetails: event, isRefundedForDelay: true });
                    updatedStatus = 'refunded';
                    refundInitiated = true;
                } else {
                    console.log(`Refund already initiated for delayed payment ${razorpayPaymentId}.`);
                }

            } catch (refundError) {
                console.error("Error initiating refund for delayed payment:", refundError);
                updatedStatus = 'refund_failed_auto';
            }
        }


        await paymentRecord.update({
            razorpayPaymentId: razorpayPaymentId,
            status: updatedStatus, // Webhook status is authoritative
            paymentDetails: event,
        });

        res.status(200).json({ status: 'Webhook received and processed', paymentStatus: updatedStatus, refundInitiated });

    } catch (error) {
        console.error("Error processing webhook event:", error);
        res.status(500).json({ error: "Webhook processing failed", details: error.message });
    }
};

const razorpayRefund = asyncWrapper( async (req, res) => {
    const { orderId } = req.body
    const userId = req.userId

    if(!orderId){
       throw ApiError.badRequest('orderId required')
    }

    const order =  await Order.findOne({
        where: {
            id: orderId,
            user_id: userId
        },
        include: [
            {
                model: 'payments'
            }
        ]
    })

    if(!order){
        throw ApiError.badRequest('order not found')
    }


})


module.exports = {
    createOrder,
    processWebhook,
    getPaymentStatus,
    verifyPayment, // Export the new verifyPayment controller
};