import { sequelize } from "../config/DBConfig";
import { DataTypes } from "sequelize";

const ReturnShipment = sequelize.define('ReturnShipment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    shipment_id: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
            model: 'shipments',
            key: 'shipment_id'
        }
    },
    shiprocket_order_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    return_shipment_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    awb_code: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
})

export default ReturnShipment;