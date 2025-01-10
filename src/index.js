import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/DBConfig.js';
import errorHandler from './middlewares/errorHandler.js';
import authRoute from './routes/authRoute.js';
import rateLimit from 'express-rate-limit';
// import sycnDB from './models/index.js';
import addressRoute from './routes/addressRoutes.js'; 
// const addressRoutes = require('./routes/addressRoutes');


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

      app.use('/api/v1/addresses', addressRoute);
      // app.use('/api/addresses', addressRoutes);
// TODO:

// AUTH
  // basic auth
    // login
    // register
    // forgot password
  // oauth
    // google
      // register
      // login
  // twillio OTP
    // send OTP
    // verify OTP

// USER PROFILE
    // get
    // update
    // table meta data
      // update order, review, address

// PRODUCT
    // fetch from square
    // update in square
    // store in local db
    // fetch from local db
    // update in local db
    // store in redis
    // fetch from redis
    // get for client

// CART
    // add
    // fetch  
    // update
    // remove
    // total

// ADDRESS auth(req.userId)
    // add
    // fetch
    // update
    // remove
    // set default

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

const port = process.env.POR || 3000;


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
