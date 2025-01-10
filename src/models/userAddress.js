import { DataTypes } from 'sequelize';
import {sequelize} from '../config/DBConfig.js';

const Address = sequelize.define('Address', {
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
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING(100),
    allowNull: true,
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
    allowNull: true,
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'addresses',
  timestamps: true,
});

export default Address;
 