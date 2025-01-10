import { DataTypes, UUID, UUIDV4 } from 'sequelize';
import {sequelize} from '../config/DBConfig.js';
import { ORDER_STATUS, PAYMENT_METHOD } from '../ENUM.js';

const generateNumericUUID = () => {
  const timestamp = Date.now().toString().slice(0,6);
  const randomPart = Math.floor(100 + Math.random() * 900); 
  return `${timestamp}-${randomPart}`; 
};

const Order = sequelize.define(
  'Order',
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
      type: DataTypes.STRING,
      defaultValue: generateNumericUUID
    },
    order_address_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'addresses',
        key: 'id',
      },
    },
    order_status: {
      type: DataTypes.ENUM,
      values: Object.values(ORDER_STATUS),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'status is required',
        },
        isIn: {
          args: [Object.values(ORDER_STATUS)],
          msg: `Color must be one of: ${Object.values(ORDER_STATUS)}`,
        },
      },
    },
    Order_date: {
      type: DataTypes.STRING,
      allowNull: false
    },
    total_item: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    total_price: {
      type: DataTypes.DECIMAL,
      allowNull: false
    },
    payment_Method: {
      type: DataTypes.ENUM,
      values: Object.values(PAYMENT_METHOD),
      allowNull: false,
      validate: {
        notNull: {
          msg: 'payment method cannot be null'
        },
        isIn: {
          args: [Object.values(PAYMENT_METHOD)],
          msg: `payment method must one of ${Object.values(PAYMENT_METHOD)}`
        }
      }
    },
    payment_id: {
      type: UUID,
      references: {
        model: 'payments',
        key: 'id',
      }
    }
  },
  {
    tableName: 'orders',
    timestamps: true,
  },
);

export default Order;
