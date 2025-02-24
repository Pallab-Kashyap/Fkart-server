import {
  verifyWebhookSignature,
  razorpayInstance,
} from '../../utils/razorpayUtils.js';
import { Payment, Refund } from '../../models/index.js';
import crypto from 'crypto';
import config from '../../config/razorpayConfig.js';
import ApiError from '../../utils/APIError.js';
import asyncWrapper from '../../utils/asyncWrapper.js';
import ApiResponse from '../../utils/APIResponse.js';
import { Order } from '../../models/index.js';
import {
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  REFUND_STATUS,
} from '../../constants.js';

import { bulkDecrementStock } from '../orderController.js';
import ProcessedWebhookEvent from '../../models/webhook.js';
import { sequelize } from '../../config/DBConfig.js';
import { createShiprocketOrder } from '../shiprocketController.js';

// Helper functions-------------------------->>>>>>>>>>>>>>>>>>>>>>>>>>>

const checkOrderStatusInDatabase = async (razorpayPaymentId) => {
  try {
    const paymentRecord = await Payment.findOne({
      where: { razorpay_payment_id: razorpayPaymentId },
      include: [
        {
          model: Order,
          attributes: ['id', 'order_status'],
        },
      ],
      attributes: ['id', 'payment_status'],
    });

    if (
      paymentRecord &&
      paymentRecord.Order.order_status === ORDER_STATUS.CANCELLED
    ) {
      if (paymentRecord.payment_status === PAYMENT_STATUS.REFUND_PROCESSED) {
        return paymentRecord;
      }
    } else {
      return null;
    }
  } catch (error) {
    throw new Error('Error checking refund status in database');
  }
};

const updateRefundStatusInDatabase = async (razorpayRefundId, refundStatus) => {
  try {
    const updatedRefund = await Refund.update(
      { refund_status: refundStatus },
      { where: { razorpay_refund_id: razorpayRefundId } }
    );

    return updatedRefund;
  } catch (error) {
    throw new Error('Error updating refund status in database');
  }
};

const checkIfWebhookEventProcessed = async (event_id, event_type) => {
  try {
    const existingEvent = await ProcessedWebhookEvent.findOne({
      where: { event_id, event_type },
    });
    return !!existingEvent;
  } catch (error) {
    throw new Error('Error checking if webhook event is processed');
  }
};

const recordProcessedWebhookEvent = async (
  event_id,
  event_type,
) => {
  try {
    await ProcessedWebhookEvent.create(
      {
        event_id,
        event_type,
      },
    );
  } catch (error) {
    throw new Error(error);
  }
};

const createRazorpayRefund = async (
  paymentId,
  amount,
  speed = 'optimum',
  notes
) => {
  try {
    const refund = await razorpayInstance.payments.refund(paymentId, {
      amount,
      speed: 'optimum',
    });
    return refund;
  } catch (error) {
    console.error('Error initiating refund:', error);
    throw error;
  }
};

const createRazorpayOrder = async (
  amount,
  currency,
  receipt = `Receipt${Date.now()}`
) => {
  console.log(receipt);
  try {
    const order = await razorpayInstance.orders.create({
      amount,
      currency,
      receipt,
    });
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw ApiError.internal(`Error creating Razorpay order: ${error}`);
  }
};

// Helper functions--------------------------<<<<<<<<<<<<<<<<<<<<<<<<<<

// Webhook helper functions-------------------------->>>>>>>>>>>>>>>>>>>>>>>>>>

const razorpayPaymentSuccessWebhook = async (paymentData) => {
  const orderId = paymentData.order_id;
  console.log('GOT SUCCESS PAYMENT');
  const transaction = await sequelize.transaction();

  try {


    const paymentRecord = await Payment.findOne(
      { where: { razorpay_order_id: orderId }, include: [{ model: Order }] },
      { transaction }
    );

    if (!paymentRecord) {
      throw new Error(400, `Payment record not found for order ID: ${orderId}`);
    }
    

    console.log('Stored payment amount:', paymentRecord.amount);
    console.log('Webhook payment amount:', paymentData.amount);

    if (Math.abs(paymentRecord.amount*100 - paymentData.amount) > 1) {
      console.log('Amount mismatch details:', {
        storedAmount: paymentRecord.amount,
        receivedAmount: paymentData.amount,
        difference: paymentRecord.amount - paymentData.amount
      });
      throw new ApiError(400, `Payment amount mismatch for order ID: ${orderId}`);
    }

    console.log('Amount validation passed');
    
    if (
      paymentRecord.payment_status === PAYMENT_STATUS.SUCCESSFUL ||
      paymentRecord.payment_status === PAYMENT_STATUS.REFUNDED
    ) {
      await transaction.rollback();

      console.error(
        `Payment already completed for order ID: ${orderId}, payment ID: ${paymentData.id}`
      );

      return;
    }

    console.log('udate');
    const up = await Payment.update(
      {
        payment_status: PAYMENT_STATUS.SUCCESSFUL,
        razorpay_transaction_id: paymentData.acquirer_data?.bank_transaction_id,
        razorpay_payment_id: paymentData.id,
        payment_gateway_method: paymentData.method,
        email: paymentData.email,
        contact: paymentData.contact,
        fee: paymentData.fee,
        tax: paymentData.tax,
      },
      {
        where: { razorpay_order_id: orderId },
        transaction: transaction,
      }
    );

    console.log('UP', up);

    await Order.update(
      {
        order_status: 'processing',
      },
      {
        where: { id: paymentRecord.order_id },
        transaction: transaction,
      }
    );

    await transaction.commit();

    await createShiprocketOrder(paymentRecord.order_id)
  } catch (error) {
    await transaction.rollback();
    console.error('Error handling Razorpay payment success webhook:', error);
    throw error;
  }
};

const razorpayPaymentfailureWebhook = async (paymentData) => {
  const orderId = paymentData.order_id;

  const transaction = await sequelize.transaction();

  try {

    const paymentRecord = await Payment.findOne(
      { where: { razorpay_order_id: orderId }, include: [{ model: Order }] },
      { transaction }
    );

    if (!paymentRecord) {
      throw new Error(`Payment record not found for order ID: ${orderId}`);
    }

    if (paymentRecord.payment_status === PAYMENT_STATUS.SUCCESSFUL) {
      throw new Error(
        400,
        `Payment already completed for order ID: ${orderId}`
      );
    }

    await Payment.update(
      {
        payment_status: PAYMENT_STATUS.FAILED,
        // razorpay_transaction_id: paymentData.acquirer_data?.bank_transaction_id,
        // razorpay_payment_id: paymentData.id,
        // payment_gateway_method: paymentData.method,
        // email: paymentData.email,
        // contact: paymentData.contact,
        // fee: paymentData.fee,
        // tax: paymentData.tax,
      },
      {
        where: { razorpay_order_id: orderId },
        transaction,
      }
    );

    await Order.update(
      {
        order_status: ORDER_STATUS.FAILED,
      },
      {
        where: { id: paymentRecord.order_id },
        transaction,
      }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error('Error handling Razorpay payment failure webhook:', error);
    throw error;
  }
};

// Webhook helper functions--------------------------<<<<<<<<<<<<<<<<<<<<<<<<<<

const verifyPayment = asyncWrapper(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw ApiError.badRequest('Missing payment verification details.');
  }

  const generatedSignature = crypto
    .createHmac('sha256', config.razorpay.key_secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generatedSignature === razorpay_signature) {
    return ApiResponse.success(
      res,
      'Payment signature verification successful.'
    );
  } else {
    console.warn(
      'Payment signature verification failed for order:',
      razorpay_order_id
    );
    throw ApiError.badRequest(
      'Payment signature verification failed. Signatures do not match.'
    );
  }
});

const razorpayWebhook = async (req, res) => {
  const webhookSignature = req.headers['x-razorpay-signature'];
  const requestBody = JSON.stringify(req.body);

  if (!verifyWebhookSignature(requestBody, webhookSignature)) {
    return ApiError.unauthorized('Webhook signature verification failed');
  }

  try {
    const event = req.body;
    const eventType = event.event;
    const paymentPayload = event.payload.payment.entity;

    const isWebhookProcessed = await checkIfWebhookEventProcessed(
      paymentPayload.id,
      eventType
    );

    if (isWebhookProcessed) {
      return ApiResponse.success('Webhook already has been processed')
    }

    console.log(eventType);
    if (eventType === 'payment.captured') {
      await razorpayPaymentSuccessWebhook(paymentPayload);
      return ApiResponse.success(
        res,
        'Webhook received and processed payment captured event'
      );
    } else if (eventType === 'payment.failed') {
      await razorpayPaymentfailureWebhook(paymentPayload);
      return ApiResponse.success(
        res,
        'Webhook received and processed payment failed event'
      );
    } else if (eventType.startsWith('refund')) {
      const refundData = event.payload.refund.entity;

      const paymentRecord = await checkOrderStatusInDatabase(
        refundData.payment_id
      );

      if (!paymentRecord) {
        console.error(
          `Payment record not found for refund ID: ${refundData.payment_id}`
        );
        return ApiResponse.success(
          res,
          'Webhook received but payment record not found for refund'
        );
      }

      if (eventType === 'refund.created') {
        await updateRefundStatusInDatabase(
          paymentRecord.id,
          REFUND_STATUS.PROCESSING
        );
      } else if (eventType === 'refund.processed') {
        await updateRefundStatusInDatabase(
          paymentRecord.id,
          REFUND_STATUS.SUCCESSFUL
        );
      } else if (eventType === 'refund.failed') {
        await updateRefundStatusInDatabase(
          paymentRecord.id,
          REFUND_STATUS.FAILED
        );
      }
    } else {
      console.log(`Unhandled Webhook Event: ${eventType}`);
    }

    await recordProcessedWebhookEvent(
      paymentData.id,
      eventType,
    );

    ApiResponse.success('Webhook processed successfully')
  } catch (error) {
    console.error('Error processing Razorpay webhook:', error);
    return ApiResponse.success(
      res,
      'Webhook received but error processing event'
    );
  }
};

export {
  createRazorpayOrder,
  verifyPayment,
  razorpayWebhook,
  createRazorpayRefund,
};
