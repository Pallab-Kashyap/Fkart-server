import { DataTypes } from 'sequelize';
import { sequelize } from '../config/DBConfig.js';

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  square_category_id: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  display_name: { 
    type: DataTypes.STRING,
    allowNull: false,
  },
  parent_id: {
    type: DataTypes.UUID,
    allowNull: true, 
    references: {
      model: 'categories',
      key: 'id',
    },
    onDelete: 'CASCADE',
  }
}, {
  tableName: 'categories',
  timestamps: true,
});

export default Category;
