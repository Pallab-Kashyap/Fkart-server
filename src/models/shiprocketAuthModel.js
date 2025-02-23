import { DataTypes } from "sequelize";
import { sequelize } from "../config/DBConfig.js";

const ShiprocketAuth = sequelize.define(
  "ShiprocketAuth",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    token: {
      type: DataTypes.STRING,
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
