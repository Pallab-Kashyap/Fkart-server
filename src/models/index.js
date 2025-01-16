import { sequelize } from '../config/DBConfig.js';
import OrderItem from './orderItemModel.js';
import Order from './orderModel.js';
import OTPVerification from './OTPModel.js';
import Payment from './paymentModel.js';
import Product from './productModel.js';
import Review from './reviewModel.js';
import Shipment from './shipmentModel.js';
import Address from './userAddress.js';
import User from './userModel.js';
import AddToCart  from './AddToCartModel.js';
const sycnDB = async () => {
  // OTP
  OTPVerification.belongsTo(User, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE',
  });
// CART
User.hasMany(AddToCart, { foreignKey: 'user_id' });
AddToCart.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });

Product.hasMany(AddToCart, { foreignKey: 'product_id' });
AddToCart.belongsTo(Product, { foreignKey: 'product_id', onDelete: 'CASCADE' });

  // ADDRESS
  User.hasMany(Address, { foreignKey: 'user_id' });
  Address.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });

  //  PRODUCT

  // ORDER
  Order.belongsTo(Address, { foreignKey: 'order_address_id' });
  Order.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });

  // ORDER ITEM
  OrderItem.belongsTo(Order, { foreignKey: 'order_id', onDelete: 'CASCADE' });
  OrderItem.belongsTo(Product, {
    foreignKey: 'product_id',
    onDelete: 'CASCADE',
  });

  // PAYMENT
  Payment.belongsTo(Order, { foreignKey: 'order_id', onDelete: 'CASCADE' });

  // SHIPMENT
  Shipment.belongsTo(Order, { foreignKey: 'order_id', onDelete: 'CASCADE' });

  // REVIEW
  User.hasMany(Review, { foreignKey: 'user_id' });
  Review.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });

  Product.hasMany(Review, { foreignKey: 'product_id' });
  Review.belongsTo(Product, { foreignKey: 'product_id', onDelete: 'CASCADE' });

  try {
    await sequelize.sync({ alter: true });
    console.log('sync completed');
  } catch (error) {
    console.log('ERROR', error);
    throw error;
  }
};

export default sycnDB;

export {
  AddToCart,
  User,
  Address,
  Product,
  Order,
  OrderItem,
  Payment,
  Shipment,
  Review,
  OTPVerification,
};
