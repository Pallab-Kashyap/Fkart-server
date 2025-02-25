import asyncWrapper from '../utils/asyncWrapper.js';
import ApiResponse from '../utils/APIResponse.js';
import { Cart, CartItem, Product, ProductVariation } from '../models/index.js';
import { sequelize } from '../config/DBConfig.js'; 
import ApiError from '../utils/APIError.js';
const calculateTotalPrice = (cartItems) => {
  return cartItems.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0);
};

// Create a new Cart
export const createCart = async (userId, transaction) => {
  try {
    await Cart.findOrCreate({
      where: { user_id: userId },
      defaults: { status: 'active' },
      transaction
    });
  } catch (error) {
    console.log(error);
    throw ApiError.internal('Error creating cart'); // Fixed: removed 'new' keyword
  }
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
            attributes: ['id','size', 'color', 'price', 'stock_quantity' ],
            include: [{
              model: Product,
              as: 'product',
              attributes: ['id', 'product_name', 'image_url']
            }],
          }, 
        ],attributes:{ exclude: [ "cart_id",'createdAt', 'updatedAt'] }
      },
    ],
    attributes: { exclude: ['user_id', 'createdAt', 'updatedAt'] }
  });

  if (!cart) {
    return ApiResponse.notFound(res, "Cart not found");
  }
 
  const updatedCartItems = [];
  let totalPrice = 0;
  for(const item of cart.CartItems){
    const productVariationPrice = parseFloat(item.product_variation.price);
    const calculatedAmount = productVariationPrice * item.quantity;
    const hasSufficientStock = item.product_variation.stock_quantity >= item.quantity;
    totalPrice += calculatedAmount;

    updatedCartItems.push({
      ...item.get(), 
      amount: calculatedAmount,
      hasSufficientStock: hasSufficientStock,
      product_variation: item.product_variation.get(), 
      product: item.product_variation.product.get() 
    });
  }
  
  const responseData = {
    id: cart.id,
    status: cart.status,
    variation_id: cart.variation_id,
    CartItems: updatedCartItems,
    totalAmount: totalPrice
  };

  return ApiResponse.success(res, "Cart retrieved successfully", responseData);
});

// Calculate total price of cart
export const calculateCartTotalPrice = asyncWrapper(async (req, res) => {
  const { cart_id } = req.params;
  const cart = await Cart.findByPk(cart_id, { include: [CartItem] });

  if (!cart) {
    return ApiResponse.notFound(res, "Cart not found");
  }

  let totalPrice = 0;
  for (const item of cart.CartItems) {
    const variation = await ProductVariation.findByPk(item.product_variation_id);
    totalPrice += variation.price * item.quantity; 
  }

  cart.totalprice = totalPrice;
  await cart.save();

  return ApiResponse.success(res, "Total price calculated successfully", { cart_id: cart.id, totalprice: cart.totalprice });
});

// Delete Cart
export const deleteCart = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const cart = await Cart.findByPk(id);

  if (!cart) {
    return ApiResponse.notFound(res, "Cart not found");
  }

  await cart.destroy();
  return ApiResponse.success(res, "Cart deleted successfully");
});
 
// Add Item to Cart
export const addItemToCart = asyncWrapper(async (req, res) => {
  const {  product_variation_id, quantity } = req.body;
 const userId = req.userId;
 let cart = await Cart.findOne({ where: { user_id: userId } });

 if (!cart) {
  cart = await Cart.create({ user_id: userId, totalprice: 0 });
  }

  const variation = await ProductVariation.findByPk(product_variation_id, {
    include: [{ model: Product, as: 'product' }],
  });

  if (!variation) {
    return ApiError.notFound(res, "Product variation not found");
  }

  if (variation.stock_quantity < quantity) {
    return ApiError.badRequest(res, "Insufficient stock");
  }

  const existingItem = await CartItem.findOne({ where: { cart_id: cart.id, product_variation_id } });

  await sequelize.transaction(async (t) => {
    if (existingItem) {
      const newTotalQuantity = existingItem.quantity + quantity;
      if (variation.stock_quantity < newTotalQuantity) {
        throw ApiError.badRequest("Exceeds available stock");
      }
      existingItem.quantity = newTotalQuantity;
      await existingItem.save({ transaction: t });
    } else {
      await CartItem.create({
        cart_id: cart.id,
        product_variation_id,
        quantity,
        price: variation.price 
      }, { transaction: t });
    }
     cart.totalprice += variation.price * quantity;
    await cart.save({ transaction: t });
  });

  return ApiResponse.success(res, "Item added to cart successfully");
});

// Update quantity of cart item
export const updateCartItem = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;
  const userId = req.userId;
  const cartItem = await CartItem.findByPk(id, {
    attributes: { exclude: ["createdAt", "updatedAt"] },
    include: [
      { model: ProductVariation, as: "product_variation", attributes: { exclude: ["createdAt", "updatedAt"] } },
      { model: Cart, where: { user_id: userId } }
    ]
  });

  if (!cartItem) {
    throw ApiError.notFound("CartItem not found");
  }

  if (quantity > cartItem.product_variation.stock_quantity) {
    throw ApiError.badRequest("Exceeds available stock");
  }

  const priceDifference = cartItem.price * (quantity - cartItem.quantity);
  cartItem.quantity = quantity;

  await sequelize.transaction(async (t) => {
    await cartItem.save({ transaction: t });
    const cart = await Cart.findByPk(cartItem.cart_id);
    cart.totalprice += priceDifference;
    await cart.save({ transaction: t });
  });

  return ApiResponse.success(res, "CartItem updated successfully", cartItem);
});

// Delete Cart Item
export const deleteCartItem = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const cartItem = await CartItem.findByPk(id);
console.log('cartItem');
  if (!cartItem) {
    return ApiError.badRequest("CartItem not found");
  }

    await cartItem.destroy();
    console.log('jfeiojefwioewiofewoifwoifeowfowwfpwpwp;');
    ApiResponse.success(res, "CartItem deleted successfully", id);
    console.log('responseed');
});

// Clear Cart
export const clearCart = asyncWrapper(async (req, res) => {
  const { cart_id } = req.params;
  const cart = await Cart.findByPk(cart_id);

  if (!cart) {
    return ApiError.notFound(res, "Cart not found");
  }

  await sequelize.transaction(async (t) => {
    await CartItem.destroy({ where: { cart_id }, transaction: t });
    cart.totalprice = 0;
    await cart.save({ transaction: t });
  });

  return ApiError.success(res, "Cart cleared successfully");
});

