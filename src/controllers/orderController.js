import { Order, OrderItem, Cart, CartItem, ProductVariation, Payment, Shipment, Product, Address, User } from '../models/index.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import ApiResponse from '../utils/ApiResponse.js';
import { sequelize } from '../config/DBConfig.js';
import { ORDER_STATUS, PAYMENT_METHOD } from '../constants.js';

// Create order from cart
export const createOrder = asyncWrapper(async (req, res) => {
  const userId = req.userId;
  const { address_id, payment_method } = req.body;

  const cart = await Cart.findOne({
    where: { user_id: userId },
    include: [{
      model: CartItem,
      include: [{
        model: ProductVariation,
        as: 'product_variation',
        include: [{ model: Product, as: 'product' }]
      }]
    }]
  });

  if (!cart || cart.CartItems.length === 0) {
    return ApiResponse.badRequest(res, "Cart is empty");
  }

  // Start transaction
  const result = await sequelize.transaction(async (t) => {
    // Validate stock and collect order items
    const orderItems = [];
    let totalItems = 0;
    let totalPrice = 0;

    for (const cartItem of cart.CartItems) {
      const variation = cartItem.product_variation;
      
      if (!variation.in_stock || variation.stock_quantity < cartItem.quantity) {
        throw new Error(`${variation.product.product_name} is out of stock`);
      }

      // Prepare order item data
      const orderItem = {
        id: crypto.randomUUID(),
        product_id: variation.product.id,
        product_variation_id: cartItem.product_variation_id,
        quantity: cartItem.quantity,
        selling_price: variation.price,
        total_Price: variation.price * cartItem.quantity,
        sku: {
          size: variation.size,
          color: variation.color
        }
      };

      orderItems.push(orderItem);
      totalItems += cartItem.quantity;
      totalPrice += orderItem.total_Price;
    }

    // Create order
    const order = await Order.create({
      user_id: userId,
      order_address_id: address_id,
      order_status: ORDER_STATUS.PROCESSING,
      Order_date: new Date().toISOString(),
      total_item: totalItems,
      total_price: totalPrice,
      payment_Method: payment_method
    }, { transaction: t });

    // Create order items and update stock
    for (let i = 0; i < cart.CartItems.length; i++) {
      const cartItem = cart.CartItems[i];
      const orderItem = orderItems[i];
      
      // Create order item
      await OrderItem.create({
        ...orderItem,
        order_id: order.id
      }, { transaction: t });

      // Update stock
      await ProductVariation.decrement('stock_quantity', {
        by: cartItem.quantity,
        where: { id: cartItem.product_variation_id },
        transaction: t
      });
    }

    // Create payment record
    await Payment.create({
      user_id: userId,
      order_id: order.id,
      amount: totalPrice,
      payment_method: payment_method,
      payment_status: 'pending',
      currency: 'INR'
    }, { transaction: t });

    // Clear cart
    await CartItem.destroy({
      where: { cart_id: cart.id },
      transaction: t
    });
    await cart.update({ totalprice: 0 }, { transaction: t });

    return order;
  });

  // Fetch complete order details
  const completeOrder = await Order.findOne({
    where: { id: result.id },
    include: [
      {  
        model: OrderItem,
        include: [
          { model: Product },
          { 
            model: ProductVariation,
            as: 'product_variation'
          }
        ]
      },
      { model: Payment },
      { model: Shipment }
      // { model: Address },  // Add this to get address details
      // { model: User }      // Add this to get user details
    ],attributes:{ exclude: ['user_id', 'order_address_id', 'createdAt', 'updatedAt'] }
  });

  return ApiResponse.created(res, "Order created successfully", completeOrder);
});
