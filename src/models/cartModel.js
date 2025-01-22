
  

// export default Cart;
import { DataTypes } from "sequelize";
import { sequelize } from '../config/DBConfig.js'; 
import CartItem from "./cartItemModel.js";

const Cart = sequelize.define('Cart', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users', // User table
            key: 'id',
        },
    }, 
    totalprice: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0,
    },
    status: {
        type: DataTypes.ENUM('active', 'checkedout'),
        defaultValue: 'active',
    },
}, {
    tableName: 'carts', 
    timestamps: true, 
});

  
  

export default Cart;   // 