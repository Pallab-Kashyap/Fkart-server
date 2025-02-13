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
    payment_status: {
      type: DataTypes.ENUM(...Object.values(PAYMENT_STATUS)),
      // defaultValue: PAYMENT_STATUS.PENDING,
    },
    transaction_id: {
      type: DataTypes.STRING(255),
      unique: true,
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
