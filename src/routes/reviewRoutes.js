import express from 'express';
import {
  createReview,
  getAllReviews,
  updateReview,
  getUserReviews,
  deleteReview
} from '../controllers/reviewController.js';
import auth from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/create', auth, createReview); 
router.get('/products/:product_id', getAllReviews);
router.put('/update/:id', auth, updateReview);
router.get('/me', auth, getUserReviews);
router.delete('/delete/:id', auth, deleteReview);

export default router;