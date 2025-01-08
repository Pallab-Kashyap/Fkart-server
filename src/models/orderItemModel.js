import { DataTypes } from "sequelize";
import {sequelize} from '../config/DBConfig.js';

const OrderItem = sequelize.define(
  "OrderItem",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      }
    }, 
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    sku: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    celling_price: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    total_Price: {
      type: DataTypes.DECIMAL,
      allowNull: false
    }
  },
  {
    timestamps: true,
  }
);



export default OrderItem;
