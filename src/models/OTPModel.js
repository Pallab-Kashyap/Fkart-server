import { DataTypes } from 'sequelize';
import { sequelize } from '../config/DBConfig.js';

const OTPVerification = sequelize.define(
  'OTPVerification',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
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
    otp_code: {
      type: DataTypes.STRING(6),
    },
    expiration_time: {
      type: DataTypes.DATE,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: 'otp_verifications',
    timestamps: true,
  },
);

export default OTPVerification;
