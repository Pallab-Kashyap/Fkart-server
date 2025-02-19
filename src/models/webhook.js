import { sequelize } from "../config/DBConfig.js";
import { DataTypes } from "sequelize";

const ProcessedWebhookEvent = sequelize.define(
    "ProcessedWebhookEvent",
    {
        id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        },
        event_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        },
        event_type: {
        type: DataTypes.STRING(255),
        allowNull: false,
        },
        event_data: {
        type: DataTypes.JSON,
        allowNull: false,
        },
    },
    {
        tableName: "processed_webhook_events",
        timestamps: true,
    }
)

export default ProcessedWebhookEvent;