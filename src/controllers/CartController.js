import asyncWrapper from '../utils/asyncWrapper.js';
import ApiResponse from '../utils/APIResponse.js';
import{Cart,CartItem,Product,ProductVariation} from '../models/index.js';
// Create a new Cart
export const createCart = asyncWrapper(async (req, res) => {
  const userId = req.userId;
  const existingCart = await Cart.findOne({ where: { user_id: userId }, 
    attributes: { exclude: ['user_id', 'createdAt', 'updatedAt'] }});
 if (existingCart) {
  return ApiResponse.success(res, "Cart already exists", existingCart);
  } 
  const cart = await Cart.create({ user_id: userId, totalprice: 0 });
return ApiResponse.created(res, "Cart created successfully", cart);
});

 
  
// fatch cart or get cart items
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
            attributes: ['id', 'size', 'color', 'price', 'in_stock'],
            include: [{
              model: Product,
              as: 'product', 
              attributes: ['id', 'product_name', 'image_url']
            }]
          },
        ],
      },
    ],
    attributes: {
      exclude: ['user_id', 'createdAt', 'updatedAt']
    }
  }); if (!cart) {
    return ApiResponse.notFound(res, "Cart not found");
  }
  return ApiResponse.success(res, "Cart retrieved successfully", cart);
});

// Calculate Total Price
export const calculateTotalPrice = async (req, res) => {
  const { cart_id } = req.params;

  try {
    const cart = await Cart.findByPk(cart_id, {
      include: [CartItem],
    });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    const totalprice = cart.CartItems.reduce((sum, item) => {
      return sum + item.price * item.quantity; 
    }, 0);
   res.status(200).json({ cart_id: cart.id, totalprice });
  } catch (error) {
    res.status(500).json({ message: 'Failed to calculate total price', error });
  }
};
// Delete Cart
export const deleteCart = async (req, res) => {
  const { id } = req.params;
 try {
    const cart = await Cart.findByPk(id);
if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
await cart.destroy();
    res.status(200).json({ message: 'Cart deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete cart', error });
  }
};

// Add Item to Cart
export const addItemToCart = asyncWrapper(async (req, res) => {
  const { cart_id, product_variation_id, quantity } = req.body; 
  const cart = await Cart.findByPk(cart_id);
  if (!cart) {
    return ApiResponse.notFound(res, "Cart not found");
  }
  const variation = await ProductVariation.findByPk(product_variation_id, {
    include: [
      {
        model: Product,
        as: 'product', 
      },
    ],
  });
  
  if (!variation) {
    return ApiResponse.notFound(res, "Product variation not found");
  }
  if (variation.stock_quantity < quantity) {
    return ApiResponse.badRequest(res, "Insufficient stock");
  }
  const existingItem = await CartItem.findOne({ 
    where: { cart_id, product_variation_id } 
  });

  if (existingItem) {
    const newTotalQuantity = existingItem.quantity + quantity;
    if (variation.stock_quantity < newTotalQuantity) {
      return ApiResponse.badRequest(res, "Exceeds available stock");
    }
    existingItem.quantity = newTotalQuantity;
    await existingItem.save();
  } else {
    await CartItem.create({ 
      cart_id, 
      product_variation_id, 
      quantity, 
      price: variation.price 
    });
  }
  cart.totalprice += variation.price * quantity;
  await cart.save();

  return ApiResponse.success(res, "Item added to cart successfully");
});
   //update quantity of cart item
export const updateCartItem = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  const cartItem = await CartItem.findByPk(id, { attributes: { exclude: ["createdAt", "updatedAt"] },
    include: [{ 
      model: ProductVariation, 
      as: "product_variation" ,attributes: { exclude: ["createdAt", "updatedAt"] },
    }]
  });

  if (!cartItem) {
    return ApiResponse.notFound(res, "CartItem not found");
  }
  if (quantity > cartItem.product_variation.stock_quantity) {
    console.log("Exceeds available stock");
    return res.json({
      status: false,
      message: "Exceeds available stock",
    });
    
  }

  const priceDifference = cartItem.price * (quantity - cartItem.quantity);
  cartItem.quantity = quantity;
  await cartItem.save();

  const cart = await Cart.findByPk(cartItem.cart_id);
  cart.totalprice += priceDifference;
  await cart.save();

  return ApiResponse.success(res, "CartItem updated successfully", cartItem);
});

// Delete Cart Item
export const deleteCartItem = async (req, res) => {
  const { id } = req.params;

  try {
    const cartItem = await CartItem.findByPk(id);

    if (!cartItem) {
      return res.status(404).json({ message: 'CartItem not found' });
    }

    const cart = await Cart.findByPk(cartItem.cart_id);

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.totalprice -= cartItem.price * cartItem.quantity;
    await cartItem.destroy();
    await cart.save();

    res.status(200).json({ message: 'CartItem deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete CartItem', error });
  }
};

// Clear Cart
export const clearCart = async (req, res) => {
  const { cart_id } = req.params;

  try {
    const cart = await Cart.findByPk(cart_id);

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    await CartItem.destroy({ where: { cart_id } });
    cart.totalprice = 0;
    await cart.save();

    res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to clear cart', error });
  }
};