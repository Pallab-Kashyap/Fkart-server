import { DataTypes, UUIDV4 } from "sequelize";
import { sequelize } from '../config/DBConfig.js';
import { PAYMENT_METHOD, PAYMENT_STATUS } from '../constants.js';

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
      allowNull: false,
      unique: true,
      onDelete: 'CASCADE',
    },
    payment_method: {
      type: DataTypes.ENUM(...Object.values(PAYMENT_METHOD)),
      allowNull: false,
    },
    payment_gateway_method: {
      type: DataTypes.STRING(255),
    },
    payment_status: {
      type: DataTypes.ENUM(...Object.values(PAYMENT_STATUS)),
      // defaultValue: PAYMENT_STATUS.PENDING,
    },
    razorpay_transaction_id: {
      type: DataTypes.STRING(255),
      unique: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'INR',
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
    },
    contact: {
      type: DataTypes.STRING(15),
    },
    payment_gateway: {
      type: DataTypes.STRING(255),
    },
    payment_data: {
      type: DataTypes.JSON,
    },
    razorpay_order_id: {
      type: DataTypes.STRING(255),
      unique: true,
    },
    razorpay_payment_id: {
      type: DataTypes.STRING(255),
      unique: true,
    },
    razorpay_signature: {
      type: DataTypes.STRING(255),
    },
    fee: {
      type: DataTypes.DECIMAL(10, 2),
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
    },
    error: {
      type: DataTypes.JSON,
    },
  },
  {
    tableName: 'payments',
    timestamps: true,
    // indexes: [
    //   { fields: ['transaction_id'] },
    //   { fields: ['razorpay_order_id'] },
    //   { fields: ['razorpay_payment_id'] }
    // ]
  }
);

export default Payment;
