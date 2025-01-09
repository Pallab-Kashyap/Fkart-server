import { DataTypes } from "sequelize";
import {sequelize} from '../config/DBConfig.js';

const Shipment = sequelize.define(
  "Shipment",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.UUID,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    shiprocket_order_id: {
      type: DataTypes.STRING
    },
    shipment_id: {
      type: DataTypes.STRING,
    },
    tracking_number: {
      type: DataTypes.STRING(100),
    },
    courier_name: {
      type: DataTypes.STRING(100),
    },
    status: {
      type: DataTypes.STRING(50),
    },

  },
  {
    tableName: 'shipments',
    timestamps: true,
  }
);


export default Shipment;
