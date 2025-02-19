import { DataTypes, UUIDV4 } from "sequelize";
import { sequelize } from '../config/DBConfig.js';
import { REFUND_STATUS } from '../constants.js';

const Refund = sequelize.define(
  "Refund",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      primaryKey: true,
    },
    payment_id: {
      type: DataTypes.UUID,
      references: {
        model: 'payments',
        key: 'id',
      },
      allowNull: false,
      onDelete: 'CASCADE',
    },
    order_id: {
      type: DataTypes.UUID,
      references: {
        model: 'orders',
        key: 'id',
      },
      allowNull: false,
      onDelete: 'CASCADE',
    },
    razorpay_refund_id: {
      type: DataTypes.STRING(255),
      unique: true,
    },
    refund_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    refund_reason: {
      type: DataTypes.TEXT,
    },
    refund_status: {
      type: DataTypes.ENUM(...Object.values(REFUND_STATUS)),
      defaultValue: REFUND_STATUS.PENDING,
    },
    refund_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    transaction_id: {
      type: DataTypes.STRING(255),
      unique: true,
    },
    refund_data: {
      type: DataTypes.JSON,
    },
  },
  {
    tableName: 'refunds',
    timestamps: true,
  }
);

export default Refund;