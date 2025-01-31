import { DataTypes, UUIDV4 } from "sequelize";
import {sequelize} from '../config/DBConfig.js';

const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
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
      references: {
        model: 'orders',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    razorpay_payment_id: {
      type: DataTypes.STRING(255),
      unique: true,
    },
    amount: {
      type: DataTypes.DECIMAL,
    },
    currency: {
      type: DataTypes.STRING,
    },
    payment_method: {
      type: DataTypes.STRING,
    },
    payment_status: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: 'payments',
    timestamps: true,
  }
);


export default Payment;
