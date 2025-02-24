import express from 'express';
import {
  createReview,
  getAllReviews,
  updateReview,
  getUserReviews,
  deleteReview
  // cc
} from '../controllers/reviewController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();
// router.post('/create', authMiddleware, createReview);
router.post('/create', authMiddleware, createReview); 
router.get('/products/:product_id', getAllReviews);
router.put('/update/:id', authMiddleware, updateReview);
router.get('/me', authMiddleware, getUserReviews);
router.delete('/delete/:id', authMiddleware, deleteReview);

export default router;