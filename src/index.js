import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/DBConfig.js';
import errorHandler from './middlewares/errorHandler.js';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import sycnDB from './models/index.js';
import Product from './models/productModel.js';
import { seedSampleData } from './utils/seedData.js';

//Routes
import addToCartRoutes from './routes/addToCartRoutes.js';
import authRoute from './routes/authRoute.js';
import addressRoute from './routes/addressRoutes.js';
import squareRoute from './routes/squareRoutes.js';
import productRoute from './routes/productRoutes.js';
import { fetchSquareCatalogList } from './controllers/squareController.js';
// const addressRoutes = require('./routes/addressRoutes');

dotenv.config();



const app = express();

app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  headers: true,
});

app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Server is up and running');
});

// AUTH
app.use('/api/v1/auth', authRoute);

// USER PROFILE
// get
// update
// table meta data
// update order, review, address

// SQUARE
app.use('/api/v1/square', squareRoute) 

// PRODUCT
app.use('/api/v1/products', productRoute);

// CART
app.use('/api/v1/cart', addToCartRoutes);


// ADDRESS auth(req.userId)
app.use('/api/v1/addresses', addressRoute);
app.use('/s', async (req, res) => {
  const data = await fetchSquareCatalogList()
  res.json(data)
})

// ORDER
// create
// fetch
// update
// remove

// PAYMENT
// initiate
// verify
// store

// SHIPPING
// Shiprocket
// create order in shiprocket
// fetch order from shiprocket
// update order in shiprocket
// cancel order in shiprocket
// webhook
// order delivered
// order returned
// local server
// create shipment in local db
// update
// fetch
// cancel for user
// webhook listner
// order delivered
// order returned

// REVIEW & FAVOURITE
// add
// fetch
// update
// remove

app.use(errorHandler);

const port = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    // await seedSampleData();
    await sycnDB();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
