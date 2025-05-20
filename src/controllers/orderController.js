import {
  Order,
  OrderItem,
  Cart,
  CartItem,
  ProductVariation,
  Payment,
  Shipment,
  Product,
  Address,
  User,
  Refund,
} from '../models/index.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import ApiResponse from '../utils/APIResponse.js';
import { sequelize } from '../config/DBConfig.js';
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS, REFUND_STATUS } from '../constants.js';
import ApiError from '../utils/APIError.js';
import { createRazorpayOrder, createRazorpayRefund } from './payment/razorpayPaymentController.js';
import { cancelShiprocketOrder, createShiprocketOrder, shiprocketReturnOrder } from './shiprocketController.js';

// Helper functions-------------------->>>>>>>>>>>>

const createOrderItems = async (items, transaction) => {
  console.log('IN CREATE ORDER ITEMS');
  const orderItemsData = [];
  let totalItems = 0;
  let totalPrice = 0;
  const variationIdsToUpdate = [];
  console.log('MAPING VARIAITONS');

  const variationIds = items.map((item) => item.product_variation_id);
  let variations;
  console.log('FINDING VARIAITONS');
  try {
    variations = await ProductVariation.findAll({
      where: { id: variationIds },
      include: [
        { 
          model: Product, 
          as: 'product', 
          attributes: ['id', 'product_name'],
          required: true // Force INNER JOIN
        },
      ],
      transaction: transaction,
      lock: transaction.LOCK.UPDATE, 
    });
  } catch (error) {
    console.log(error);
    throw new Error(`Error fetching product variations: ${error.message}`);
  }
  console.log('CREATING VARIATION MAP');
  const variationMap = new Map(variations.map((v) => [v.id, v]));

  console.log('ITERATING ITEMS');
  for (const item of items) {
    const variation = variationMap.get(item.product_variation_id);

    if (!variation || variation.stock_quantity < item.quantity) {
      const productName = variation
        ? variation.product.product_name
        : `Product Variation ID ${item.product_variation_id}`;
      throw ApiError.badRequest(`${productName} is out of stock or insufficient quantity available`);
    }

    const totalItemPrice = variation.price * item.quantity;
    orderItemsData.push({
      id: crypto.randomUUID(),
      product_id: variation.product.id,
      product_variation_id: item.product_variation_id,
      quantity: item.quantity,
      selling_price: variation.price,
      total_Price: totalItemPrice,
      sku: { size: variation.size, color: variation.color },
      order_id: null,
    });
    totalItems += item.quantity;
    totalPrice += totalItemPrice;

    variationIdsToUpdate.push({
      id: item.product_variation_id,
      quantityToDecrement: item.quantity,
    });
  }

  return { orderItemsData, totalItems, totalPrice, variationIdsToUpdate };
};

const placeOrder = async (cartItems, orderDetails, userInfo, transaction) => {
  const { paymentMethod, addressId } = orderDetails;
  console.log('IN PLACE ORDER');
  try {
    const { orderItemsData, totalItems, totalPrice, variationIdsToUpdate } =
      await createOrderItems(cartItems, transaction);

    console.log('CREATING ORDER');
    console.log(paymentMethod);
    const order = await Order.create(
      {
        user_id: userInfo.userId,
        total_amount: totalPrice,
        payment_method: paymentMethod.toLowerCase(),
        order_status: ORDER_STATUS.PENDING,
        order_address_id: addressId,
        total_item: totalItems,
      },
      { transaction }
    );

    console.log('CREATING ORDER ITEMS');
    const orderItemsWithOrderId = orderItemsData.map((itemData) => ({
      ...itemData,
      order_id: order.id,
    }));
    await OrderItem.bulkCreate(orderItemsWithOrderId, { transaction });
    await bulkDecrementStock(variationIdsToUpdate, transaction);
    
    if (paymentMethod.toLowerCase() === PAYMENT_METHOD.COD) {
      console.log('UPDATING VARIATIONS ON COD');
      order.order_status = ORDER_STATUS.PROCESSING;
      await order.save({ transaction });

      await Payment.create({
        user_id: userInfo.userId,
        order_id: order.id,
        payment_method: PAYMENT_METHOD.COD,
        payment_status: PAYMENT_STATUS.PENDING,
        amount: totalPrice
      }, { transaction })
      
      return { order, shiprocket: true };
    } else if(paymentMethod.toLowerCase() === PAYMENT_METHOD.PREPAID){
      console.log('CREATING RAZORPAY ORDER');
      const razorpayOrder = await createRazorpayOrder(
        totalPrice*100,
        'INR',
        `receiptid_${order.id.substring(0, 10)}`
      );
      await Payment.create(
        {
          id: crypto.randomUUID(),
          user_id: userInfo.userId,
          order_id: order.id,
          payment_method: PAYMENT_METHOD.PREPAID,
          payment_status: PAYMENT_STATUS.PENDING,
          payment_gateway: 'razorpay',
          amount: totalPrice,
          currency: 'INR',
          razorpay_order_id: razorpayOrder.id,
        },
        { transaction: transaction }
      );
      return {razorpayOrder};
    }
  } catch (error) {
    console.error('Error placing order:', error);
    throw error;
  }
};

export const bulkDecrementStock = async (variationUpdates, transaction) => {
  if (!variationUpdates || variationUpdates.length === 0) {
    return;
  }
  // Lock the corresponding product variations rows
  const ids = variationUpdates.map((item) => item.id);
  const variations = await ProductVariation.findAll({
    where: { id: ids },
    transaction: transaction,
    lock: transaction.LOCK.UPDATE, // added pessimistic lock
  });

  // Check stock availability under the lock
  for (const update of variationUpdates) {
    const variation = variations.find((v) => v.id === update.id);
    if (!variation || variation.stock_quantity < update.quantityToDecrement) {
      throw new Error(`Product variation ${update.id} has insufficient stock`);
    }
  }

  const updatePromises = variationUpdates.map((update) => {
    return ProductVariation.decrement('stock_quantity', {
      by: update.quantityToDecrement,
      where: { id: update.id },
      transaction: transaction,
    });
  });
  await Promise.all(updatePromises);
};

export const bulkIncrementStock = async (orderId, transaction) => {
  // Get all order items for the order
  const orderItems = await OrderItem.findAll({
    where: { order_id: orderId },
    transaction: transaction,
  });

  if (!orderItems || orderItems.length === 0) {
    throw new Error('No order items found');
  }

  // Create updates array with variation IDs and quantities
  const variationUpdates = orderItems.map(item => ({
    id: item.product_variation_id,
    quantityToIncrement: item.quantity
  }));

  // Lock the corresponding product variations rows
  const ids = variationUpdates.map(item => item.id);
  const variations = await ProductVariation.findAll({
    where: { id: ids },
    transaction: transaction,
    lock: transaction.LOCK.UPDATE
  });

  const updatePromises = variationUpdates.map(update => {
    return ProductVariation.increment('stock_quantity', {
      by: update.quantityToIncrement,
      where: { id: update.id },
      transaction: transaction,
    });
  });

  await Promise.all(updatePromises);
};

const isOrderReturnEligible = (deliveryDate) => {
  if (!deliveryDate) return false;
  const today = new Date();
  const delivered = new Date(deliveryDate);
  const diffTime = Math.abs(today - delivered);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 7;
};

const isOrderCancellationEligible = (orderDate) => {
  if (!orderDate) return false;
  const today = new Date();
  const ordered = new Date(orderDate);
  const diffTime = Math.abs(today - ordered);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 2;
};

// Helper functions<<<<<<<<<<<<<<<----------------------

export const cartCheckout = asyncWrapper(async (req, res) => {
  const {
    userId,
    body: { addressId, paymentMethod },
  } = req;
  
  if (
    !(
      paymentMethod.toLowerCase() === PAYMENT_METHOD.COD ||
      paymentMethod.toLowerCase() === PAYMENT_METHOD.PREPAID
    )
  ) {
    throw ApiError.badRequest(
      `payment method must of one of: ${PAYMENT_METHOD.COD} or ${PAYMENT_METHOD.PREPAID}`
    );
  }

  if (!addressId) {
    throw ApiError.badRequest('addressId is a required field');
  }

  const transaction = await sequelize.transaction();

  try {
    const cart = await Cart.findOne(
      {
        where: { user_id: userId },
        include: [
          {
            model: CartItem,
          },
        ],
      },
      {
        transaction,
        lock: transaction.LOCK.UPDATE,
      }
    );

    if (!cart || !cart.CartItems || cart.CartItems.length === 0) {
      throw ApiError.badRequest('Cart is empty');
    }

    const { razorpayOrder, order, shiprocket } = await placeOrder(
      cart.CartItems,
      { paymentMethod, addressId },
      { userId },
      transaction
    );

    await transaction.commit();

    
    ApiResponse.created(res, 'Order created successfully', razorpayOrder || null);
    if(shiprocket){
      await createShiprocketOrder(order.id);
    }
  } catch (error) {
    await transaction.rollback();
    console.log(error);
   throw error
  }
});

export const returnOrder = asyncWrapper(async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  const userId = req.userId

  const transaction = await sequelize.transaction();

  try {
    const order = await Order.findOne({
      where: { id: orderId, user_id: userId },
      include: [
        {
          model: OrderItem,
          as: 'OrderItems',
          include: [
            {
              model: ProductVariation,
              as: 'product_variation',
              include: [{ model: Product, as: 'product' }],
            },
          ],
        },
        { model: Payment },
        { model: Shipment },
        { model: Address },
        { model: User },
      ],
      transaction,
    });

    if (!order) {
      throw ApiError.badRequest('Order not found');
    }


    if (order.payment_method !== PAYMENT_METHOD.PREPAID) {
      throw ApiError.badRequest('Only prepaid orders are eligible for return');
    }


    const shipment = order.Shipment;
    if (!shipment || shipment.status !== 'delivered') {
      throw ApiError.badRequest('Only delivered orders can be returned');
    }


    if (!isOrderReturnEligible(shipment.delivery_date)) {
      throw ApiError.badRequest('Return window has expired (7 days from delivery)');
    }


    const returnData = {
      sellerDetails: {
        name: 'Store Name',
        address: 'Store Address',
        city: 'Store City',
        state: 'Store State',
        country: 'India',
        pincode: 'Pincode',
        email: 'store@email.com',
        phone: 'store phone'
      },
      customerDetails: {
        name: order.Address.name,
        address: order.Address.address,
        address_2: order.Address.address_2 || '',
        city: order.Address.city,
        state: order.Address.state,
        country: order.Address.country,
        pincode: order.Address.pincode,
        email: order.User.email,
        phone: order.Address.phone
      },
      orderDetails: {
        original_order_id: orderId,
        items: order.OrderItems.map(item => ({
          name: item.product_variation.product.product_name,
          quantity: item.quantity,
          sku: item.sku,
          units: item.quantity,
          selling_price: item.selling_price
        })),
        payment_method: PAYMENT_METHOD.PREPAID,
        sub_total: order.Payment.amount
      }
    };


    const returnShipment = await shiprocketReturnOrder(returnData);


    const razorpayRefund = await createRazorpayRefund(
      order.Payment.razorpay_payment_id,
      order.Payment.amount * 100
    );


    await Refund.create({
      payment_id: order.Payment.id,
      order_id: orderId,
      razorpay_refund_id: razorpayRefund.id,
      refund_amount: razorpayRefund.amount / 100, 
      refund_reason: reason,
      refund_status: razorpayRefund.status,
      refund_date: new Date(razorpayRefund.created_at * 1000), 
      transaction_id: razorpayRefund.payment_id,
    }, { transaction });
 
    // await bulkIncrementStock(orderId, transaction);

    await order.Payment.update({
      payment_status: PAYMENT_STATUS.REFUND_PROCESSED,
    }, { transaction });

    await order.update({
      order_status: ORDER_STATUS.RETURN_INITIATED,
      return_reason: reason,
    }, { transaction });

    await transaction.commit();

    return ApiResponse.success(res, 'Return initiated successfully', {
      return_shipment: returnShipment,
      refund: razorpayRefund
    });

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

export const cancelOrder = asyncWrapper(async (req, res) => {
  const { orderId } = req.params;
  const { reason } = req.body;
  const userId = req.userId;

  const transaction = await sequelize.transaction();

  try {
    const order = await Order.findOne({
      where: { id: orderId, user_id: userId },
      include: [
        {
          model: OrderItem,
          as: 'OrderItems',
          include: [
            {
              model: ProductVariation,
              as: 'product_variation',
              include: [{ model: Product, as: 'product' }],
            },
          ],
        },
        { model: Payment },
        { model: Shipment },
      ],
      transaction,
    });

    if (!order) {
      throw ApiError.badRequest('Order not found for the user');
    }

    if(order.order_status === ORDER_STATUS.CANCELLED){
      throw ApiError.badRequest('Order already has been canceled')
    }
    else if( order.order_status === ORDER_STATUS.DELIVERED){
      throw ApiError.badRequest('Order cannot be canceled after delivered')
    }
    else if ( order.order_status === ORDER_STATUS.FAILED){
      throw ApiError.badRequest('Failed orders cannot be canceled')
    }
    else if ( order.order_status == ORDER_STATUS.RETURNED){
      throw ApiError.badRequest("Order is already returned")
    }
    else if ( order.order_status === ORDER_STATUS.RETURN_INITIATED){
      throw ApiError.badRequest("Return initiated and can't cancel now")
    }


    if (!isOrderCancellationEligible(order.createdAt)) {
      throw ApiError.badRequest('Cancellation window has expired (2 days from order date)');
    }

    
    if (order.Shipment) {
      await cancelShiprocketOrder(order.Shipment.shiprocket_order_id); 
    }

    if (order.payment_method === PAYMENT_METHOD.PREPAID && order.Payment && order.Payment.payment_status === PAYMENT_STATUS.SUCCESSFUL) {
      const razorpayRefund = await createRazorpayRefund(
        order.Payment.razorpay_payment_id,
        order.Payment.amount * 100
      );


      await Refund.create({
        payment_id: order.Payment.id,
        order_id: orderId,
        razorpay_refund_id: razorpayRefund.id,
        refund_amount: razorpayRefund.amount / 100,
        refund_reason: reason,
        refund_status: REFUND_STATUS.PROCESSING,
        refund_date: new Date(razorpayRefund.created_at * 1000),
        transaction_id: razorpayRefund.payment_id,
      }, { transaction });

      await order.Payment.update({
        payment_status: PAYMENT_STATUS.REFUND_PROCESSED,
      }, { transaction });
    }

    // await bulkIncrementStock(orderId, transaction);


    await order.update({
      order_status: ORDER_STATUS.CANCELLED,
      cancel_reason: reason,
    }, { transaction });

    await transaction.commit();

    return ApiResponse.success(res, 'Order cancelled successfully', {
      order_id: orderId,
      payment_status: order.Payment ? order.Payment.payment_status : 'Not paid yet',
      refund_status: order.Payment && order.Payment.payment_status === PAYMENT_STATUS.SUCCESSFUL ? 'Processed' : 'Not applicable'
    });

  } catch (error) {
    await transaction.rollback();
    console.log(error);
    throw error;
  }
});

export const createOrderFromProduct = asyncWrapper(async (req, res) => {
  const {
    userId,
    body: { address_id, payment_method, product_variation_id, quantity },
  } = req;
  const validPaymentMethod = payment_method.toLowerCase();
  const result = await sequelize.transaction(async (t) => {
    const variation = await ProductVariation.findOne({
      where: { id: product_variation_id },
      include: [{ model: Product, as: 'product' }],
      transaction: t,
    });

    if (
      !variation ||
      !variation.in_stock ||
      variation.stock_quantity < quantity
    ) {
      throw new Error('Product is out of stock');
    }

    const totalPrice = variation.price * quantity;
    const order = await Order.create(
      {
        user_id: userId,
        order_address_id: address_id,
        order_status: ORDER_STATUS.PROCESSING,
        Order_date: new Date().toISOString(),
        total_item: quantity,
        total_price: totalPrice,
        payment_Method: payment_method,
      },
      { transaction: t }
    );

    await OrderItem.create(
      {
        id: crypto.randomUUID(),
        order_id: order.id,
        product_id: variation.product.id,
        product_variation_id: product_variation_id,
        quantity: quantity,
        selling_price: variation.price,
        total_Price: totalPrice,
        sku: { size: variation.size, color: variation.color },
      },
      { transaction: t }
    );

    await variation.decrement('stock_quantity', {
      by: quantity,
      transaction: t,
    });

    // Create payment record
    await Payment.create(
      {
        user_id: userId,
        order_id: order.id,
        // amount: totalPrice,
        payment_method: payment_method,
        payment_status: 'pending',
        currency: 'INR',
      },
      { transaction: t }
    );

    return order;
  });

  const completeOrder = await getOrderDetails(result.id);
  return ApiResponse.created(res, 'Order created successfully', completeOrder);
});

export const getOrderAndOrderItemsDetails = async (orderId) => {
  return await Order.find({
    where: {
      id: orderId,
    },
    include: {
      model: OrderItem,
      as: 'OrderItems',
      include: {
        model: Product,
        attributes: ['product_name'],
      },
    },
  });
};

export const getOrders = asyncWrapper(async (req, res) => {
  const userId  = req.userId;
  const { status } = req.params;

  if(status && !Object.values(ORDER_STATUS).includes(status)){
    throw ApiError.badRequest(`Status must be one of: "processing", "delivered", "cancelled", "returned"`)
  }

  const where = { user_id: userId };
  if (status) {
    where.order_status = status;
  }

  const orders = await Order.findAll({
    where,
    include: [
      {
        model: OrderItem,
        as: 'OrderItems',
        attributes: ['quantity'],
      },
      {
        model: Shipment,
        attributes: ['tracking_url', 'delivery_date', 'courier_name'],
      }
    ],
    order: [['createdAt', 'DESC']],
  });

  const formattedOrders = orders.map(order => ({
    id: order.id,
    order_no: order.order_id,
    total_amount: order.total_amount,
    total_items: order.total_item,
    order_status: order.order_status,
    tracking_url: order.Shipment?.tracking_url || null,
    order_date: order.createdAt,
  }));

  return ApiResponse.success(res, 'Orders fetched successfully', formattedOrders);
});

export const getOrderDetails = asyncWrapper(async (req, res) => {
  const { orderId } = req.params;
  const  userId  = req.userId;

  if(orderId === undefined || orderId === null) { 
    throw ApiError.badRequest('Order ID is required');
  }

  const order = await Order.findOne({
    where: { id: orderId, user_id: userId },
    include: [
      {
        model: OrderItem,
        as: 'OrderItems',
        include: [
          {
            model: Product,
            
            attributes: ['id', 'product_name', 'image_url'],
          },
          {
            model: ProductVariation,
            as: 'product_variation',
            attributes: ['id', 'price', 'color', 'size'],
          }
        ]
      },
      {
        model: Payment,
        attributes: ['payment_method', 'payment_status', 'amount'],
        include: [
          {
            model: Refund,
            attributes: ['refund_status', 'refund_amount',]
          }
        ]
      },
      {
        model: Address,
        as: 'shipping_address',
      },
      {
        model: Shipment,
        attributes: ['tracking_url', 'delivery_date', 'courier_name', 'status'],
      }
    ]
  });

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  const formattedOrder = {
    order_details: {
      id: orderId,
      order_no: order.order_id,
      order_status: order.order_status,
      total_amount: order.total_amount,
      total_items: order.total_item,
      order_date: order.createdAt,
    },
    items: order.OrderItems.map(item => ({
      order_item_id: item.id,
      product_name: item.Product.product_name,
      product_image: item.product_variation.image_url?.[0],
      variant: {
        color: item.product_variation?.color || "",
        size: item.product_variation.size
      },
      quantity: item.quantity,
      price: item.selling_price,
      total_price: item.total_Price
    })),
    shipping_details: {
      address: {
        name: order.shipping_address.name,
        phone: order.shipping_address.phone,
        address_line1: order.shipping_address.address,
        address_line2: order.shipping_address.address_2,
        city: order.shipping_address.city,
        state: order.shipping_address.state,
        pincode: order.shipping_address.pincode,
        country: order.shipping_address.country
      },
      delivery_partner: order.Shipment?.courier_name,
      tracking_url: order.Shipment?.tracking_url,
      delivery_date: order.Shipment?.delivery_date,
      shipping_status: order.Shipment?.status
    },
    payment_details: {
      method: order.Payment.payment_method,
      status: order.Payment.payment_status,
      amount: order.Payment.amount,
      refund: order.Payment.Refund
    }
  };

  return ApiResponse.success(res, 'Order details fetched successfully', formattedOrder);
});
