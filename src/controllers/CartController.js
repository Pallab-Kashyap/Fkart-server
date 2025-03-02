import asyncWrapper from '../utils/asyncWrapper.js';
import ApiResponse from '../utils/APIResponse.js';
import { Cart, CartItem, Product, ProductVariation } from '../models/index.js';
import { sequelize } from '../config/DBConfig.js';
import ApiError from '../utils/APIError.js';

// Create a new Cart
export const createCart = async (userId, transaction) => {
  const [cart, created] = await Cart.findOrCreate({
    where: { user_id: userId },
    defaults: { status: 'active' },
    transaction,
    raw: true,
  });

  return created ? cart : null;
};

// Fetch cart or get cart items
export const getCart = asyncWrapper(async (req, res) => {
  const userId = req.userId;
  const cart = await Cart.findOne({
    where: { user_id: userId },
    include: [
      {
        model: CartItem,
        include: [
          {
            model: ProductVariation,
            as: 'product_variation',
            attributes: ['id', 'size', 'color', 'price', 'stock_quantity'],
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'product_name', 'image_url'],
              },
            ],
          },
        ],
        attributes: { exclude: ['cart_id', 'createdAt', 'updatedAt'] },
      },
    ],
    attributes: { exclude: ['user_id', 'createdAt', 'updatedAt'] },
  });

  if (!cart) {
    throw ApiError.notFound('Cart not found');
  }

  const updatedCartItems = [];
  let totalPrice = 0;
  for (const item of cart.CartItems) {
    const productVariationPrice = parseFloat(item.product_variation.price);
    const calculatedAmount = productVariationPrice * item.quantity;
    const hasSufficientStock =
      item.product_variation.stock_quantity >= item.quantity;
    totalPrice += calculatedAmount;

    updatedCartItems.push({
      ...item.get(),
      amount: calculatedAmount,
      hasSufficientStock: hasSufficientStock,
      product_variation: item.product_variation.get(),
      product: item.product_variation.product.get(),
    });
  }

  const responseData = {
    id: cart.id,
    status: cart.status,
    variation_id: cart.variation_id,
    CartItems: updatedCartItems,
    totalAmount: totalPrice,
  };

  return ApiResponse.success(res, 'Cart retrieved successfully', responseData);
});

// Calculate total price of cart
export const calculateCartTotalPrice = asyncWrapper(async (req, res) => {
  const { cart_id } = req.params;
  const cart = await Cart.findByPk(cart_id, { include: [CartItem] });

  if (!cart) {
    return ApiResponse.notFound(res, 'Cart not found');
  }

  let totalPrice = 0;
  for (const item of cart.CartItems) {
    const variation = await ProductVariation.findByPk(
      item.product_variation_id
    );
    totalPrice += variation.price * item.quantity;
  }

  cart.totalprice = totalPrice;
  await cart.save();

  return ApiResponse.success(res, 'Total price calculated successfully', {
    cart_id: cart.id,
    totalprice: cart.totalprice,
  });
});

// Delete Cart
export const deleteCart = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const cart = await Cart.findByPk(id);

  if (!cart) {
    return ApiResponse.notFound(res, 'Cart not found');
  }

  await cart.destroy();
  return ApiResponse.success(res, 'Cart deleted successfully');
});

// Add Item to Cart
export const addItemToCart = asyncWrapper(async (req, res) => {
  const { product_variation_id, quantity } = req.body;
  const userId = req.userId;

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw ApiError.badRequest(
      'Quantity must be of type integer/number and greater than 0'
    );
  }

  let cart = await Cart.findOne({ where: { user_id: userId } });

  if (!cart) {
    cart = await Cart.create({ user_id: userId });
  }

  const variation = await ProductVariation.findByPk(product_variation_id, {
    include: [{ model: Product, as: 'product' }],
  });

  if (!variation) {
    throw ApiError.notFound(res, 'Product variation not found');
  }

  if (variation.stock_quantity < quantity) {
    throw ApiError.badRequest(res, 'Insufficient stock');
  }

  const existingItem = await CartItem.findOne({
    where: { cart_id: cart.id, product_variation_id },
  });

  await sequelize.transaction(async (t) => {
    if (existingItem) {
      const newTotalQuantity = existingItem.quantity + quantity;
      if (variation.stock_quantity < newTotalQuantity) {
        throw ApiError.badRequest('Exceeds available stock');
      }
      existingItem.quantity = newTotalQuantity;
      await existingItem.save({ transaction: t });
    } else {
      await CartItem.create(
        {
          cart_id: cart.id,
          product_variation_id,
          quantity,
          price: variation.price,
        },
        { transaction: t }
      );
    }
    cart.totalprice += variation.price * quantity;
    await cart.save({ transaction: t });
  });

  return ApiResponse.success(res, 'Item added to cart successfully');
});

// Update quantity of cart item
export const updateCartItem = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const userId = req.userId;

  if (!Number.isInteger(quantity) || quantity < 0) {
    throw ApiError.badRequest(
      'Quantity must be of type integer/number and cannot be negetive'
    );
  }

  const cartItem = await CartItem.findByPk(id, {
    attributes: { exclude: ['createdAt', 'updatedAt'] },
    include: [
      {
        model: ProductVariation,
        as: 'product_variation',
        attributes: { exclude: ['createdAt', 'updatedAt'] },
      },
      { model: Cart, where: { user_id: userId } },
    ],
  });

  if (!cartItem) {
    throw ApiError.notFound('CartItem not found');
  }

  if (quantity > cartItem.product_variation.stock_quantity) {
    throw ApiError.badRequest('Exceeds available stock');
  }

  cartItem.quantity = quantity;

  await cartItem.save({ transaction: t });

  return ApiResponse.success(res, 'CartItem updated successfully', cartItem);
});

// Delete Cart Item
export const deleteCartItem = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  const cart = await Cart.findOne({
    where: { user_id: userId },
  });

  if (!cart) {
    const transaction = await sequelize.transaction();

    try {
      await createCart(userId, transaction);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw ApiError.internal('Error in creating cart');
    }

    throw ApiError.badRequest('Item is not in cart');
  }
  const cartItem = await CartItem.findOne({
    where: {
      id,
      cart_id: cart.id,
    },
  });

  if (!cartItem) {
    throw ApiError.badRequest('CartItem not found');
  }

  await cartItem.destroy();
  ApiResponse.success(res, 'CartItem deleted successfully');
});

// Clear Cart
export const clearCart = asyncWrapper(async (req, res) => {

  const userId = req.userId;

  const cart = await Cart.findOne({
    where: { user_id: userId },
    attributes: ['id'],
  });

  if (!cart) {
    const transaction = await sequelize.transaction();

    try {
      await createCart(userId, transaction);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    return ApiResponse.success(res, 'All Cart Items are cleared');
  }

  await CartItem.destroy({ where: { cart_id: cart.id } });

  return ApiResponse.success(res, 'Cart cleared successfully');
});
