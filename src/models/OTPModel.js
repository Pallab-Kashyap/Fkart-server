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
      allowNull: false,
      validate: {
        len: [6, 6],
        isNumeric: true
      }
    },
    expiration_time: {
      type: DataTypes.DATE,
      allowNull: false
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

OTPVerification.cleanup = async () => {
  await OTPVerification.destroy({
    where: {
      expiration_time: { [Op.lt]: new Date() }
    }
  });
};

export default OTPVerification;
