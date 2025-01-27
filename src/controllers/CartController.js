// import Cart from '../models/cartModel.js';
// import CartItem from '../models/cartItemModel.js';
// import Product from '../models/productModel.js';
import asyncWrapper from '../utils/asyncWrapper.js';
import ApiResponse from '../utils/APIResponse.js';
import{Cart,CartItem,Product} from '../models/index.js';
// Create a new Cart
export const createCart = asyncWrapper(async (req, res) => {
  const userId = req.userId;
  const existingCart = await Cart.findOne({ where: { user_id: userId } });
 if (existingCart) {
    return ApiResponse.badRequest(res, "Cart already exists for this user");
  } // Create a new cart for the user
  const cart = await Cart.create({ user_id: userId, totalprice: 0 });
return ApiResponse.created(res, "Cart created successfully", cart);
});


//  
// fatch cart 
// export const getCart = async (req, res) => {
//   const { user_id } = req.params;

//   try {
//     const cart = await Cart.findOne({
//       where: { user_id },
//       include: [
//         {
//           model: CartItem,
//           include: [
//             {
//               model: Product, 
//               attributes: ['id', 'product_name', 'price'], },],}, ],});
//    if (!cart) {
//       return res.status(404).json({ message: 'Cart not found' });
//     } 

//     res.status(200).json(cart);
//   } catch (error) {
//     console.error('Error fetching cart:', error); // Log the error for debugging
//     res.status(500).json({ message: 'Failed to fetch cart', error });
//   }
// };

export const getCart = asyncWrapper(async (req, res) => {
  const { user_id } = req.params;

  // Fetch the cart along with its items and related product details
  const cart = await Cart.findOne({
    where: { user_id },
    include: [
      {
        model: CartItem,
        include: [
          {
            model: Product,
            attributes: ['id', 'product_name', 'price'], // Select only the needed attributes
          },
        ],
      },
    ],
  });

  // If no cart is found, return a 404 response
  if (!cart) {
    return ApiResponse.notFound(res, "Cart not found");
  }

  // Return the cart with a success response
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
// export const addItemToCart = async (req, res) => {
//   const { cart_id, product_id, quantity, price } = req.body;

//   try {
//     const cart = await Cart.findByPk(cart_id);

//     if (!cart) {
//       return res.status(404).json({ message: 'Cart not found' });
//     }

//     const product = await Product.findByPk(product_id);

//     if (!product) {
//       return res.status(404).json({ message: 'Product not found' });
//     }

//     const existingItem = await CartItem.findOne({ where: { cart_id, product_id } });

//     if (existingItem) {
//       existingItem.quantity += quantity;
//       await existingItem.save();
//     } else {
//       await CartItem.create({ cart_id, product_id, quantity, price });
//     }

//     cart.totalprice += price * quantity;
//     await cart.save();

//     res.status(200).json({ message: 'Item added to cart successfully' });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to add item to cart', error });
//   }
// };
export const addItemToCart = async (req, res) => {
  const { cart_id, product_id, quantity } = req.body; // Removed 'price' from req.body

  try {
    // Check if the cart exists
    const cart = await Cart.findByPk(cart_id);

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Fetch the product and its price
    const product = await Product.findByPk(product_id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const productPrice = product.price; // Get the price from the Product model

    // Check if the item already exists in the cart
    const existingItem = await CartItem.findOne({ where: { cart_id, product_id } });

    if (existingItem) {
      
      existingItem.quantity += quantity;
      await existingItem.save();
    } else {
      
      await CartItem.create({ cart_id, product_id, quantity, price: productPrice });
    }

    
    cart.totalprice += productPrice * quantity;
    await cart.save();

    res.status(200).json({ message: 'Item added to cart successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add item to cart', error });
  }
};
   
// Update Cart Item
export const updateCartItem = async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  try {
    const cartItem = await CartItem.findByPk(id);

    if (!cartItem) {
      return res.status(404).json({ message: 'CartItem not found' });
    }

    const cart = await Cart.findByPk(cartItem.cart_id);

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const priceDifference = cartItem.price * (quantity - cartItem.quantity);
    cartItem.quantity = quantity;

    await cartItem.save();

    cart.totalprice += priceDifference;
    await cart.save();

    res.status(200).json({ message: 'CartItem updated successfully', cartItem });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update CartItem', error });
  }
};

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