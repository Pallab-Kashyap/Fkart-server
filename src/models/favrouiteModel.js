import { DataTypes } from 'sequelize';
import { sequelize } from '../config/DBConfig.js';

const Favorite = sequelize.define(
  'Favorite',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    product_variation_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'product_variations',
        key: 'id',
      },
    },
  },
  {
    tableName: 'favorites',
    timestamps: true,
  }
);

export default Favorite;
