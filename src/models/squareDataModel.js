import { sequelize } from "../config/DBConfig.js";
import { DataTypes } from "sequelize";

const SquareData = sequelize.define(
  "SquareData",
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
    iv: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expire_at: {
      type: DataTypes.STRING,
    },
    merchant_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    tableName: "square_data",
  }
);

export default SquareData;
