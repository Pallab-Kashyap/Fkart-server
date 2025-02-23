import { DataTypes } from "sequelize";
import { sequelize } from "../config/DBConfig.js";

const ShiprocketAuth = sequelize.define(
  "ShiprocketAuth",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE, 
      allowNull: false,
    },
  },
  {
    tableName: "shiprocket_auth",
    timestamps: false,
  }
);

export default ShiprocketAuth;
