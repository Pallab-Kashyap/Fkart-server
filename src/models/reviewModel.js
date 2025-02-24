import { DataTypes } from "sequelize";
import {sequelize} from '../config/DBConfig.js'; 
import OrderItem from "./orderItemModel.js";

const Review = sequelize.define(
  "Review",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    order_item_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: OrderItem,
        key: 'id'
      }
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    product_variation_id: {  
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'product_variations',
        key: 'id'
      },
    },
    comment: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: 'reviews',
    timestamps: true,
  }
);



export default Review;
