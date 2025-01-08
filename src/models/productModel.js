import { DataTypes } from "sequelize";
import { sequelize } from '../config/DBConfig.js';

const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    square_product_id: {
      type: DataTypes.STRING(255),
      unique: true,
    },
    product_name: {
      type: DataTypes.STRING(100),
    },
    description: {
      type: DataTypes.TEXT,
    },
    price: {
      type: DataTypes.DECIMAL,
    },
    quantity: {
      type: DataTypes.INTEGER,
    },
    image_url: {
      type: DataTypes.STRING(255),
    },
  },
  {
    tableName: "products",
    timestamps: true,
  }
);

export default Product;
