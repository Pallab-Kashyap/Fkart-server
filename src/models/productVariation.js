import { sequelize } from '../config/DBConfig.js';
import { DataTypes } from 'sequelize';
import { CartItem, Cart } from '../models/index.js'; 

const ProductVariation = sequelize.define(
  'ProductVariation',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    product_id: {
      type: DataTypes.UUID,
      references: {
        model: 'products',
        key: 'id',
      },
      allowNull: false,
    },
    size: {
      type: DataTypes.ENUM(
        'S',
        'M',
        'L',
        'XL',
        'XXL',
        '6',
        '7',
        '8',
        '9',
        '10'
      ),
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: true, // Make color nullable
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    stock_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    in_stock: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    image_url: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true,
    },
  },
  {
    tableName: 'product_variations',
    timestamps: true,
  }
);

ProductVariation.addHook('beforeCreate', (variation) => {
  variation.dataValues.in_stock = variation.dataValues.stock_quantity > 0;
});

ProductVariation.addHook('beforeUpdate', (variation) => {
  variation.dataValues.in_stock = variation.dataValues.stock_quantity > 0;
});

ProductVariation.addHook('beforeSave', async (variation) => {
  // Using get() to access the current value
  const stockQty = variation.get('stock_quantity');
  variation.set('in_stock', stockQty > 0);
});

// Hook to update CartItem prices when ProductVariation price changes
ProductVariation.addHook('afterUpdate', async (variation, options) => {
  if (variation.changed('price')) {
    try {
      console.log(`Updating prices for variation ${variation.id} to ${variation.price}`);
      await CartItem.update(
        { price: variation.price },
        { 
          where: { product_variation_id: variation.id },
          individualHooks: true
        }
      );
    } catch (error) {
      console.error('Error updating CartItem prices:', error);
    }
  }
});
const calculateTotalPrice = (cartItems) => {
  return cartItems.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0);
};

export default ProductVariation;
