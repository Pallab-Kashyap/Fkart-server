import { DataTypes } from 'sequelize';
import { sequelize } from '../config/DBConfig.js';
import User from './userModel.js';
import Product from './productModel.js';

const AddToCart = sequelize.define('AddToCart', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Product,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
  price: {
    type: DataTypes.DECIMAL,
    allowNull: false,
  },
  discount: {
    type: DataTypes.DECIMAL,
    defaultValue: 0,
  },
}, {
  tableName: 'add_to_cart',
  timestamps: true,
});

export default AddToCart;
