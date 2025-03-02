import { DataTypes } from 'sequelize';
import { sequelize } from '../config/DBConfig.js';

const Settings = sequelize.define('Settings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,  // Changed to UUID to match User model's id
    allowNull: false,
    unique: true,
    references: {
      model: 'users',  // Changed to lowercase to match User model's tableName
      key: 'id'
    }
  },
  salesNotification: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  newArrivalsNotification: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  deliveryStatusNotification: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'settings' 
});

export default Settings;