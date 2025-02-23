import { DataTypes } from 'sequelize';
import {sequelize} from '../config/DBConfig.js';

const OrderAddress = sequelize.define('OrderAddress', {
  
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
    onDelete: 'CASCADE',
  },  
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: {
        msg: "Name field required"
      }
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { 
        msg: "Phone field required"
      },
      is: /^[0-9]{10}$/ // Example for 10-digit Indian phone number
    }
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
        notNull: {
            msg: "address flied required"
        }
    }
  },
  address_2:{
    type: DataTypes.STRING
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  pincode: {
    type: DataTypes.STRING(20),
    allowNull: false ,
    validate: {
        notNull: {
            msg: "pincode flied required"
        },
        is: /^[0-9]{6}$/
    }
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'order_addresses',
  timestamps: true,
});

export default OrderAddress;
 