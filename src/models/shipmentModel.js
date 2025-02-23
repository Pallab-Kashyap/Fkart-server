import { DataTypes } from "sequelize";
import { sequelize } from "../config/DBConfig.js";

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
      allowNull: false,
      references: {
        model: "orders",
        key: "id",
      },
    },

    shiprocket_order_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    shipment_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    awb_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    courier_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    courier_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "created",
        "awb_generated",
        "pickup_scheduled",
        "in_transit",
        "delivered",
        "rto_initiated",
        "returned",
        "cancelled"
      ),
      allowNull: false,
    },

    freight_charge: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    length: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    breadth: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    height: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    pickup_scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    label_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    invoice_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    tracking_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    manifest_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    shipping_details: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    pickup_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    estimated_delivery_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    delivery_date: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  },
  {
    tableName: "shipments",
    timestamps: true,
  }
);

export default Shipment;
