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


//Routes
import addToCartRoutes from './routes/addToCartRoutes.js';
import authRoute from './routes/authRoute.js';
import addressRoute from './routes/addressRoutes.js';
import squareRoute from './routes/squareRoutes.js';
import productRoute from './routes/productRoutes.js';
import categoryRoute from './routes/categoryRoutes.js';
import orderRoute from './routes/orderRoutes.js'
import paymentRoute from './routes/paymentRoutes.js';
import { fetchSquareCatalogList } from './controllers/squareController.js';
import Razorpay from 'razorpay';
// const addressRoutes = require('./routes/addressRoutes');


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

let instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.post('/create-order', async (req, res) => {
  const { amount, currency = 'INR', receipt = 'order_rcptid_11' } = req.body;

  try {
    const response = await instance.orders.create({
      amount: parseInt(amount), 
      currency,
      receipt
    });
    console.log(response);
    res.json({
      id: response.id,
      currency: response.currency,
      amount: response.amount,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Razorpay Error:', error);
    res.status(500).json({ error: error.message });
  }
});

import crypto from 'crypto'

app.post('/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature === razorpay_signature) {
    res.json({ success: true, message: 'Payment verified successfully' });
  } else {
    res.status(400).json({ success: false, message: 'Invalid signature' });
  }
});


app.post('/razorpay-webhook', async (req, res) => {
  const { body } = req;
  // console.log('Razorpay Webhook:', body);
  const paymentPayload = body.payload
  console.log(paymentPayload);
  res.json({ success: true });
})

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