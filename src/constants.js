const ORDER_STATUS = Object.freeze({
    PENDING: 'pending',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    FAILED: 'failed'
});

const PAYMENT_METHOD = Object.freeze({
    RAZORPAY: 'razorpay',
    COD: 'cod'
});

const PAYMENT_STATUS = Object.freeze({
    PENDING: 'pending',
    PROCESSING: 'processing',
    SUCCESSFUL: 'successful',
    FAILED: 'failed',
    REFUND_PROCESSED: 'refund_processed',
    REFUNDED: 'refunded'
});

const REFUND_STATUS = Object.freeze({
    PENDING: 'pending',
    PROCESSING: 'processing',
    SUCCESSFUL: 'successful',
    FAILED: 'failed'
});

export  {
    ORDER_STATUS,
    PAYMENT_METHOD,
    PAYMENT_STATUS,
    REFUND_STATUS
}