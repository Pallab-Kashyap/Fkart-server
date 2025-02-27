import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/DBConfig.js';
import errorHandler from './middlewares/errorHandler.js';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import sycnDB, { ProductVariation } from './models/index.js';
import Product from './models/productModel.js';
import { seedSampleData } from './utils/seedData.js';
import favoriteRoutes from './routes/favrouiteRoutes.js';


//Routes
import addToCartRoutes from './routes/addToCartRoutes.js';
import authRoute from './routes/authRoute.js';
import addressRoute from './routes/addressRoutes.js';
import squareRoute from './routes/squareRoutes.js';
import productRoute from './routes/productRoutes.js';
import categoryRoute from './routes/categoryRoutes.js';
import orderRoute from './routes/orderRoutes.js'
import paymentRoute from './routes/paymentRoutes.js';
import shippingRoute from './routes/shiprocketRoute.js';
import { fetchSquareCatalogList } from './controllers/squareController.js';
import Razorpay from 'razorpay';
import reviewRoutes from './routes/reviewRoutes.js';
import profileRoutes from './routes/profileRoutes.js';


dotenv.config();

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
app.use('/api/v1', profileRoutes);
// get
// update
// table meta data
// update order, review, address

// SQUARE
app.use('/api/v1/square', squareRoute) 

// PRODUCT
app.use('/api/v1/products', productRoute);
app.use('/api/v1/categories', categoryRoute)

// CART
app.use('/api/v1/cart', addToCartRoutes);


// ADDRESS auth(req.userId)
app.use('/api/v1/addresses', addressRoute);
app.use('/s', async (req, res) => {
  const data = await fetchSquareCatalogList()
  res.json(data)
})

// ORDER
app.use('/api/v1/orders', orderRoute);
// create
// fetch
// update
// remove

// PAYMENT
app.use('/api/v1/payments', paymentRoute);
// initiate
// verify
// store

// SHIPPING
app.use('/api/v1/shipping', shippingRoute);
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
app.use('/api/v1/review', reviewRoutes);
app.use('/api/v1/favorites', favoriteRoutes);
// add
// fetch
// update
// remove

app.get('/razor-ui', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/razorpay.html'));
});

app.use(errorHandler);

const port = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    await sycnDB();
    // await seedSampleData()
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
// const changePrice = async (price, id) => {
//   await ProductVariation.update(
//     { price },
//     {where : { id }}
//   )
// }
// changePrice(1556,'231937e1-c7e8-4113-8593-f5cbb590cbe7')