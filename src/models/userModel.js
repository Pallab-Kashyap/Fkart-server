import { DataTypes } from 'sequelize';
import { sequelize } from '../config/DBConfig.js';

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'userName is required',
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        arg: true,
        msg: 'email already exists',
      },
      validate: {
        notNull: {
          msg: 'email is required',
        },
        isEmail: {
          msg: 'Please provide a valid email address',
        },
      },
    },
    phone_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: {
        arg: true,
        msg: 'phone number already exists'

      },
      validate: {
        notNull: {
          msg: 'phone number is required',
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'password is required',
        },
      },
    },
    oauth_provider: {
      type: DataTypes.STRING(50),
    },
    oauth_id: {
      type: DataTypes.STRING(255),
    },
    refresh_token: {
      type: DataTypes.STRING(255),
    },
  },
  {
    timestamps: true,
    tableName: 'users',
  }
);

export default User;
