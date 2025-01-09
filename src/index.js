import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/DBConfig.js';
import errorHandler from './middlewares/errorHandler.js';
import authRoute from './routes/authRoute.js';
import rateLimit from 'express-rate-limit';
// import sycnDB from './models/index.js';

dotenv.config();
connectDB();
// sycnDB();

const app = express()

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many requests from this IP, please try again after 15 minutes',
  headers: true, 
})

app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/v1', (req, res) => {
  res.send('Server is up and running');
});

app.use('/api/v1/auth', authRoute);
// user
// products
// cart
// address
// Order
// Payment
// Shipment
// review

app.use(errorHandler);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
