import express from 'express';
import { getUserProfile } from '../controllers/profileController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import auth from '../middlewares/authMiddleware.js';
const router = express.Router();

router.get('/profile', auth, getUserProfile);

export default router;