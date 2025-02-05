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
import Cart from './cartModel.js';
import CartItem from './cartItemModel.js';
import SquareData from './squareDataModel.js';
import ProductVariation from './productVariation.js';
import Category from './categoryModel.js';
// import Category from './categoryModel.js';

const sycnDB = async () => {
  // OTP
  OTPVerification.belongsTo(User, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE',
  });

  Cart.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });

  Cart.hasMany(CartItem, { foreignKey: 'cart_id', onDelete: 'CASCADE' });
  CartItem.belongsTo(Cart, { foreignKey: 'cart_id', onDelete: 'CASCADE' });

  Product.hasMany(CartItem, { foreignKey: 'product_id', onDelete: 'CASCADE' });
  CartItem.belongsTo(Product, {
    foreignKey: 'product_id',
    onDelete: 'CASCADE',
  });
  // ADDRESS
  User.hasMany(Address, { foreignKey: 'user_id', onDelete: 'CASCADE' });
  Address.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });

  //  PRODUCT
  Product.hasMany(ProductVariation, {
    foreignKey: 'product_id',
    as: 'variations',
  });

  ProductVariation.belongsTo(Product, {
    foreignKey: 'product_id',
    as: 'product',
    onDelete: 'CASCADE',
  });

  // Add Product-Category association
  Product.belongsTo(Category, {
    foreignKey: 'category_id',
    as: 'category'
  });
  Category.hasMany(Product, {
    foreignKey: 'category_id',
    as: 'products'
  });

  // CATEGORY
  Category.hasMany(Category, { foreignKey: 'parent_id', as: 'subcategories' });
  Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parentCategory' });

  // ORDER
  Order.belongsTo(Address, { foreignKey: 'order_address_id' });
  Order.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
  Order.hasOne(Payment, { foreignKey: 'order_id', onDelete: 'CASCADE' });

  // ORDER ITEM
  OrderItem.belongsTo(Order, { foreignKey: 'order_id', onDelete: 'CASCADE' });
  OrderItem.belongsTo(Product, {
    foreignKey: 'product_id',
    onDelete: 'CASCADE',
  });

  // PAYMENT


  // SHIPMENT
  Shipment.belongsTo(Order, { foreignKey: 'order_id', onDelete: 'CASCADE' });

  // REVIEW
  User.hasMany(Review, { foreignKey: 'user_id', onDelete: 'CASCADE' });
  Review.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });

  Product.hasMany(Review, { foreignKey: 'product_id', onDelete: 'CASCADE' });
  Review.belongsTo(Product, { foreignKey: 'product_id', onDelete: 'CASCADE' });

  try {
    // await User.sync({ force: true });
    // await Product.sync({ force: true });
    // await ProductVariation.sync({ force: true });
    // await Address.sync();
    // await Cart.sync();
    // await CartItem.sync();
    // await OTPVerification.sync();
    // await Order.sync();
    // await OrderItem.sync();
    // await Payment.sync();
    await sequelize.sync({});
    // await Review.sync();
    console.log('sync completed');
  } catch (error) {
    console.log('ERROR', error);
    throw error;
  }
};

export default sycnDB;

export {
  Cart,
  CartItem,
  User,
  Address,
  Product,
  ProductVariation,
  Order,
  OrderItem,
  Payment,
  Shipment,
  Review,
  OTPVerification,
  SquareData,
  Category,
};
