import { Order, OrderItem, Cart, CartItem, ProductVariation, Payment, Shipment, Product, Address, User } from '../models/index.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import ApiResponse from '../utils/ApiResponse.js';
import { sequelize } from '../config/DBConfig.js';
import { ORDER_STATUS, PAYMENT_METHOD } from '../constants.js';

const getOrderDetails = async (orderId) => {
  return Order.findOne({
    where: { id: orderId },
  include: [
    { model: Address, attributes: ['id','country','address', 'city', 'state', 'pincode'] },
    { model: Shipment },
    { model: Payment, attributes: ['payment_method','amount','payment_status'] }
  ],
  attributes: ['id', 'total_price', 'order_status', 'Order_date', 'total_item']
});
};

// Create order from cart-------------------------------->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
export const createOrder = asyncWrapper(async (req, res) => {
  const { userId, body: { address_id, payment_method } } = req;

  const cart = await Cart.findOne({
    where: { user_id: userId },
    include: [
      {
        model: CartItem,
        include: [
          {
            model: ProductVariation,
            as: 'product_variation',
            include: [{ model: Product, as: 'product' }]
          }
        ]
      }
    ]
  });

  if (!cart || cart.CartItems.length === 0) {
    return ApiResponse.badRequest(res, "Cart is empty");
  }
  const result = await sequelize.transaction(async (t) => {
    const orderItems = [];
    let totalItems = 0;
    let totalPrice = 0;

    await Promise.all(cart.CartItems.map(async (cartItem) => {
      const variation = cartItem.product_variation;

      if (!variation.in_stock || variation.stock_quantity < cartItem.quantity) {
        throw new Error(`${variation.product.product_name} is out of stock`);
      }

const totalItemPrice = variation.price * cartItem.quantity;
      orderItems.push({
        id: crypto.randomUUID(),
        product_id: variation.product.id,
        product_variation_id: cartItem.product_variation_id,
        quantity: cartItem.quantity,
        selling_price: variation.price,
        total_Price: totalItemPrice,
        sku: { size: variation.size, color: variation.color }
      });
         totalItems += cartItem.quantity;
      totalPrice += totalItemPrice;
      await ProductVariation.decrement('stock_quantity', {
        by: cartItem.quantity,
        where: { id: cartItem.product_variation_id },
        transaction: t
      });
    }));
    const order = await Order.create({
      user_id: userId,
      order_address_id: address_id,
      order_status: ORDER_STATUS.PROCESSING,
      Order_date: new Date().toISOString(),
      total_item: totalItems,
      total_price: totalPrice,
      payment_Method: payment_method
    }, { transaction: t });
    await OrderItem.bulkCreate(orderItems.map(item => ({
      ...item,
      order_id: order.id
    })), { transaction: t });
    await Payment.create({
      user_id: userId,
      order_id: order.id,
      amount: totalPrice,
      payment_method: payment_method, 
      payment_status: 'pending',
      currency: 'INR'
    }, { transaction: t });
    await CartItem.destroy({
      where: { cart_id: cart.id },
      transaction: t
    });
    await cart.update({ totalprice: 0 }, { transaction: t });
    return order;
  });
  const completeOrder = await getOrderDetails(result.id);
  return ApiResponse.created(res, "Order created successfully", completeOrder);
});

// Create order directly from product--------------------------------------------->>>>>>>>>>>>>>>>>>>>>>>>>>>
export const createOrderFromProduct = asyncWrapper(async (req, res) => {
  const { userId, body: { address_id, payment_method, product_variation_id, quantity } } = req;

  const result = await sequelize.transaction(async (t) => {
    const variation = await ProductVariation.findOne({
      where: { id: product_variation_id },
      include: [{ model: Product, as: 'product' }],
      transaction: t
    });

    if (!variation || !variation.in_stock || variation.stock_quantity < quantity) {
      throw new Error("Product is out of stock");
    }

    const totalPrice = variation.price * quantity;
    const order = await Order.create({
      user_id: userId,
      order_address_id: address_id,
      order_status: ORDER_STATUS.PROCESSING,
      Order_date: new Date().toISOString(),
      total_item: quantity,
      total_price: totalPrice,
      payment_Method: payment_method
    }, { transaction: t });

    await OrderItem.create({
      id: crypto.randomUUID(),
      order_id: order.id,
      product_id: variation.product.id,
      product_variation_id: product_variation_id,
      quantity: quantity,
      selling_price: variation.price,
      total_Price: totalPrice,
      sku: { size: variation.size, color: variation.color }
    }, { transaction: t });

    await variation.decrement('stock_quantity', { by: quantity, transaction: t });

    // Create payment record
    await Payment.create({
      user_id: userId,
      order_id: order.id,
      amount: totalPrice,
      payment_method: payment_method,
      payment_status: 'pending',
      currency: 'INR'
    }, { transaction: t });

    return order;
  });

  const completeOrder = await getOrderDetails(result.id);
  return ApiResponse.created(res, "Order created successfully", completeOrder);
});

// Get order by ID  ------------------------------------->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
export const getOrder = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const order = await getOrderDetails(id);

  if (!order) {
    return ApiResponse.notFound(res, "Order not found");
  }

  return ApiResponse.success(res, "Order retrieved successfully", order);
});

// Get user's orders------------------------------------>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
export const getUserOrders = asyncWrapper(async (req, res) => {
  const { userId } = req;
  const orders = await Order.findAll({ 
  where: { user_id: userId },
  attributes: ['id', 'Order_date', 'total_item', 'total_price', 'order_status'],
  order: [['createdAt', 'DESC']]
});
  return ApiResponse.success(res, "Orders retrieved successfully", orders);
});
