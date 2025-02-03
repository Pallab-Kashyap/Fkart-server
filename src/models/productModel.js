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
    category: {
      type: DataTypes.ENUM,
      values: ['men', 'women', 'kids']
    },
    type: {
      type: DataTypes.ENUM,
      values: ['clothing', 'footwear']
    },
    image_url: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      allowNull: true
    },
    // category_id: {
    //   type: DataTypes.INTEGER,
    //   references: {
    //     model: 'categories',
    //     key: 'id',
    //   },
    //   allowNull: true,
    // }
  },
  {
    tableName: "products",
    timestamps: true,
  }
);

export default Product;

