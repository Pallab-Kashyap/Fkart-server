import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/DBConfig.js';
import errorHandler from './middlewares/errorHandler.js';

dotenv.config();

const app = express();
connectDB();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World from ES6 Express Server!');
});


app.use(errorHandler);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
