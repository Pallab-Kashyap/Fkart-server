import { sequelize } from "../config/DBConfig";
import {DataTypes} from 'sequelize'

const SquareData = sequelize.define('SquareData',{
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false
    },
    expiry: {
        type: DataTypes
    }

})