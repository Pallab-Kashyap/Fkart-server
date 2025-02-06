import express from 'express';
import {
  createReview,
  getProductReviews,
  getUserReviews,
  updateReview,
  deleteReview
} from '../controllers/reviewController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/create', authMiddleware, createReview);
router.get('/product/:product_id', getProductReviews);
router.get('/user', authMiddleware, getUserReviews);
router.put('/update/:review_id', authMiddleware, updateReview);
router.delete('/delete/:review_id', authMiddleware, deleteReview);

export default router;
