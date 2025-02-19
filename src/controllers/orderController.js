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
} from '../models/index.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import ApiResponse from '../utils/APIResponse.js';
import { sequelize } from '../config/DBConfig.js';
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '../constants.js';
import ApiError from '../utils/APIError.js';
import { createRazorpayOrder } from './payment/razorpayPaymentController.js';


// Helper functions-------------------->>>>>>>>>>>>


const createOrderItems = async (items, transaction) => { 

console.log('IN CREATE ORDER ITEMS');
  const orderItemsData = []; 
  let totalItems = 0;
  let totalPrice = 0;
  const variationIdsToUpdate = []; 
  console.log('MAPING VARIAITONS');

  const variationIds = items.map(item => item.product_variation_id);
  let variations;
  console.log('FINDING VARIAITONS');
try {
     variations = await ProductVariation.findAll({
        where: { id: variationIds },
        include: [
          { model: Product, 
            as: 'product',
            attributes: ['id', 'product_name']
          }
        ],
    },{transaction });
} catch (error) {
    await transaction.rollback(); 
    throw new Error(`Error fetching product variations: ${error.message}`);
}
console.log('CREATING VARIATION MAP');
  const variationMap = new Map(variations.map(v => [v.id, v])); 

console.log('ITERATING ITEMS');
  for (const item of items) { 
      const variation = variationMap.get(item.product_variation_id); 

      if (!variation || variation.stock_quantity < item.quantity) {
          const productName = variation ? variation.product.product_name : `Product Variation ID ${item.product_variation_id}`; 
          throw new Error(
              `${productName} is out of stock or insufficient quantity available` 
          );
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
          quantityToDecrement: item.quantity
      });
  }


  return { orderItemsData, totalItems, totalPrice, variationIdsToUpdate }; 
};

const placeOrder = async (cartItems, orderDetails, userInfo, transaction) => { 
const { paymentMethod, addressId } = orderDetails;
console.log('IN PLACE ORDER');
  try {
      const { orderItemsData, totalItems, totalPrice, variationIdsToUpdate } = await createOrderItems(cartItems, transaction); 

console.log('CREATING ORDER');
console.log(paymentMethod);
      const order = await Order.create({
          user_id: userInfo.userId, 
          total_amount: totalPrice,
          payment_method: paymentMethod.toLowerCase(),
          order_status: PAYMENT_STATUS.PENDING, 
          order_address_id: addressId,
          total_item: totalItems,
      }, { transaction });

console.log('CREATING ORDER ITEMS');
      const orderItemsWithOrderId = orderItemsData.map(itemData => ({
          ...itemData,
          order_id: order.id,
      }));
      await OrderItem.bulkCreate(orderItemsWithOrderId, { transaction });

      if (paymentMethod.toLowerCase() === PAYMENT_METHOD.COD) {
        console.log('UPDATING VARIATIONS ON COD');
          await bulkDecrementStock(variationIdsToUpdate, transaction); 
          return { data: null }
      } 
      else{
        console.log('CREATING RAZORPAY ORDER');
        const razorpayOrder = await createRazorpayOrder(totalPrice, 'INR', `recptid_${order.id}`)
        await Payment.upsert({
          user_id: userInfo.userId,
          order_id: order.id,
          payment_method: PAYMENT_METHOD.RAZORPAY,
          payment_status: PAYMENT_STATUS.PENDING,
          payment_gateway: 'razorpay',
          amount: totalPrice,
          currency: 'INR',
          razorpay_order_id: razorpayOrder.id,
        },
        { transaction: transaction }
        );
        return { data: razorpayOrder }
      }

  } catch (error) {
      await transaction.rollback(); 
      console.error("Error placing order:", error);
      throw error; 
  }
}


export const bulkDecrementStock = async (variationUpdates, transaction) => {  
  if (!variationUpdates || variationUpdates.length === 0) {
      return; 
  }

  const updatePromises = variationUpdates.map(update => {
      return ProductVariation.decrement('stock_quantity', {
          by: update.quantityToDecrement,
          where: { id: update.id },
          transaction: transaction
      });
  });
  await Promise.all(updatePromises);
}

// Helper functions<<<<<<<<<<<<<<<----------------------


export const cartCheckout = asyncWrapper(async (req, res) => { 
  const { userId, body: { addressId, paymentMethod } } = req;

  if(!((paymentMethod.toLowerCase() === PAYMENT_METHOD.COD) || (paymentMethod.toLowerCase() === PAYMENT_METHOD.RAZORPAY))) { 
    throw ApiError.badRequest(`paymaent method must of one of: ${ PAYMENT_METHOD.COD} or ${PAYMENT_METHOD.RAZORPAY}`)
  }

  if(!addressId){
    throw ApiError.badRequest('addressId is a required field')
  }


  let cart = await Cart.findOne({
    where: { user_id: userId },
    include: [
      {
        model: CartItem,
      },
    ],
  });

  if (!cart || !cart.CartItems || cart.CartItems.length === 0) {
    throw ApiError.badRequest("Cart is empty");
  }

  const transaction = await sequelize.transaction();
   const data = await placeOrder(cart.CartItems, {paymentMethod, addressId}, { userId }, transaction)

   await transaction.commit();

   return ApiResponse.created(res, 'Order created successfully', data)

});




const getOrderDetails = async (orderId) => {
  return Order.findOne({
    where: { id: orderId },
    include: [
      {
        model: Address,
        attributes: ['id', 'country', 'address', 'city', 'state', 'pincode'],
      },
      // { model: Shipment },
      // {
      //   model: Payment,
      //   attributes: ['payment_method', 'amount', 'payment_status'],
      // },
    ],
    attributes: [
      'id',
      'total_price',
      'order_status',
      'Order_date',
      'total_item',
    ],
  });
};

// Create order from cart-------------------------------->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
export const createOrder = asyncWrapper(async (req, res) => {
  const {
    userId,
    body: { address_id, payment_method },
  } = req;

  const validPaymentMethod = payment_method.toLowerCase();
  const cart = await Cart.findOne({
    where: { user_id: userId },
    include: [
      {
        model: CartItem,
        include: [
          {
            model: ProductVariation,
            as: 'product_variation',
          },
        ],
      },
    ],
  });

  if (!cart || !cart.CartItems || cart.CartItems.length === 0) {
    throw ApiError.badRequest("Cart is empty");
  }
  const result = await sequelize.transaction(async (t) => {
    const orderItems = [];
    let totalItems = 0;
    let totalPrice = 0;

    await Promise.all(
      cart.CartItems.map(async (cartItem) => {
        const variation = cartItem.product_variation;

        if (
          !variation.in_stock ||
          variation.stock_quantity < cartItem.quantity
        ) {
          throw ApiError.badRequest(
            `${variation.product.product_name} is out of stock`
          );
        }

        const totalItemPrice = variation.price * cartItem.quantity;
        orderItems.push({
          id: crypto.randomUUID(),
          product_id: variation.product.id,
          product_variation_id: cartItem.product_variation_id,
          quantity: cartItem.quantity,
          selling_price: variation.price,
          total_Price: totalItemPrice,
          sku: { size: variation.size, color: variation.color },
        });
        totalItems += cartItem.quantity;
        totalPrice += totalItemPrice;
        await ProductVariation.decrement('stock_quantity', {
          by: cartItem.quantity,
          where: { id: cartItem.product_variation_id },
          transaction: t,
        });
      })
    );

    const order = await Order.create(
      {
        user_id: userId,
        order_address_id: address_id,
        order_status: ORDER_STATUS.PROCESSING,
        Order_date: new Date().toISOString(),
        total_item: totalItems,
        total_price: totalPrice,
        payment_Method: payment_method,
      },
      { transaction: t }
    );
    await OrderItem.bulkCreate(
      orderItems.map((item) => ({
        ...item,
        order_id: order.id,
      })),
      { transaction: t }
    );
    await Payment.create(
      {
        user_id: userId,
        order_id: order.id,
        amount: totalPrice,
        payment_method: payment_method,
        payment_status: 'pending',
        currency: 'INR',
      },
      { transaction: t }
    );
    await CartItem.destroy({
      where: { cart_id: cart.id },
      transaction: t,
    });
    await cart.update({ totalprice: 0 }, { transaction: t });
    return order;
  });
  const completeOrder = await getOrderDetails(result.id);
  return ApiResponse.created(res, 'Order created successfully', completeOrder);
});

// Create order directly from product--------------------------------------------->>>>>>>>>>>>>>>>>>>>>>>>>>>
export const createOrderFromProduct = asyncWrapper(async (req, res) => {
  const {
    userId,
    body: { address_id, payment_method, product_variation_id, quantity },
  } = req;

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
        amount: totalPrice,
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

// Get order by ID  ------------------------------------->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
export const getOrder = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const order = await getOrderDetails(id);

  if (!order) {
    return ApiResponse.notFound(res, 'Order not found');
  }

  return ApiResponse.success(res, 'Order retrieved successfully', order);
});

// Get user's orders------------------------------------>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
export const getUserOrders = asyncWrapper(async (req, res) => {
  const { userId } = req;
  const orders = await Order.findAll({
    where: { user_id: userId },
    attributes: [
      'id',
      'Order_date',
      'total_item',
      'total_price',
      'order_status',
    ],
    order: [['createdAt', 'DESC']],
  });
  return ApiResponse.success(res, 'Orders retrieved successfully', orders);
});
