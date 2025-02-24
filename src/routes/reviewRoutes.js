import express from 'express';
import {
  createReview,
  getAllReviews,
  updateReview,
  getUserReviews,
  deleteReview
} from '../controllers/reviewController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// router.post('/create', authMiddleware, createReview);
// router.get('/product/:product_id', getAllReviews);
// router.get('/reviews/user', authMiddleware, getUserReviews);
// router.put('/update/:review_id', authMiddleware, updateReview);
// router.delete('/delete/:review_id', authMiddleware, deleteReview);


router.post('/create', authMiddleware, createReview);
router.get('/products/:product_id', getAllReviews);
router.put('/update/:id', authMiddleware, updateReview);
router.get('/me', authMiddleware, getUserReviews);
router.delete('/delete/:id', authMiddleware, deleteReview);

export default router;