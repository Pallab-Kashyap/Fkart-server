
import { DataTypes } from "sequelize";
import { sequelize } from '../config/DBConfig.js';
import Cart from './cartModel.js';
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
    product_id: { 
        type: DataTypes.UUID, // Change to DataTypes.UUID 
        allowNull: false,
        references: {
            model: 'products', 
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
// CartItem.associate = (models) => {
//     CartItem.belongsTo(models.Cart, { foreignKey: "cart_id", onDelete: "CASCADE" }); // Item belongs to one cart
//     CartItem.belongsTo(models.Product, { foreignKey: "product_id", onDelete: "CASCADE" }); // Item is associated with one product
//   };
export default CartItem