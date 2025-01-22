// import Cart from '../models/cartModel.js';
// import CartItem from '../models/cartItemModel.js';
// import Product from '../models/productModel.js';
import{Cart,CartItem,Product} from '../models/index.js';
// Create a new Cart
export const createCart = async (req, res) => {
  const { user_id } = req.body;

  try {
    const existingCart = await Cart.findOne({ where: { user_id } });

    if (existingCart) {
      return res.status(400).json({ message: 'Cart already exists for this user' });
    }

    const cart = await Cart.create({ user_id, totalprice: 0 });
    res.status(201).json(cart);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create cart', error });
  }
};
 
export const getCart = async (req, res) => {
  const { user_id } = req.params;

  try {
    const cart = await Cart.findOne({
      where: { user_id },
      include: [
        {
          model: CartItem,
          include: [
            {
              model: Product, 
              attributes: ['id',  'price'], },],}, ],});
   if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    res.status(200).json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error); // Log the error for debugging
    res.status(500).json({ message: 'Failed to fetch cart', error });
  }
};
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
