const ORDER_STATUS = Object.freeze({
    PENDING: 'pending',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
    FAILED: 'failed'
});

const PAYMENT_METHOD = Object.freeze({
    PREPAID: 'razorpay',
    COD: 'cod'
});

const PAYMENT_STATUS = Object.freeze({
    PENDING: 'pending',
    PROCESSING: 'processing',
    SUCCESSFUL: 'successful',
    FAILED: 'failed',
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