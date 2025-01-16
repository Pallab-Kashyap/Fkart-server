import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './config/DBConfig.js';
import errorHandler from './middlewares/errorHandler.js';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
// import sycnDB from './models/index.js';

//Routes
import authRoute from './routes/authRoute.js';
import addressRoute from './routes/addressRoutes.js'; 
import squareRoute from './routes/squareRoutes.js';
// const addressRoutes = require('./routes/addressRoutes');


dotenv.config();
connectDB();
// sycnDB(); 

const app = express()

app.use(cors({
  origin: '*',
  credentials: true,
}));

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


// app.use('/api/addresses', addressRoutes);
// TODO:

// AUTH
app.use('/api/v1/auth', authRoute);
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
    app.use('/api/v1/addresses', addressRoute);


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

    app.get('/api/v1/list-items', async (req, res) => {
              const accessToken = 'EAAAllknGMfOLfzwpIKtAG-5B9SijXTfKSA1cfkLZd7LHe_oMSqu4QHxsDwzAAT5'
      
              try {
                  const response = await fetch('https://connect.squareup.com/v2/catalog/list', {
                      method: 'GET',
                      headers: {
      
                          'Authorization': `Bearer ${accessToken}`,
                          'Content-Type': 'application/json'
                      }
                  });
                  const data = await response.json();
                  console.log(data);
      
                  if (response.ok) {
                      res.json(data);
                  } else {
                      res.status(400).send(response);
                  }
              } catch (error) {
                  res.status(500).send('Internal Server Error');
              }
          });


app.use(errorHandler);

const port = process.env.POR || 8080;


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
