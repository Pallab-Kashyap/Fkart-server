
import { DataTypes } from "sequelize";
import { sequelize } from '../config/DBConfig.js';

const CartItem = sequelize.define('CartItem', {
    id: {
        type: DataTypes.UUID, 
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    cart_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'carts', 
            key: 'id',
        },
    },

    product_variation_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'product_variations',
            key: 'id',
        },
    },
    quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1, 
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
}, {
    tableName: 'cart_items', 
});

export default CartItem