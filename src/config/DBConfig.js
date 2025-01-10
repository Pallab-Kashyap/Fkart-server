import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

const sequelize = new Sequelize(process.env.DB_CONNECTION_URL_RAILWAY, {
  dialect: 'postgres',
  dialectOptions: {

  },
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};
 
export {
  connectDB,
  sequelize
}
