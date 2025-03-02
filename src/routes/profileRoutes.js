import express from 'express';
import { 
  getUserProfile, 
  updateNotificationSettings,
  getNotificationSettings 
} from '../controllers/profileController.js';
import auth from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/profile', auth, getUserProfile);
router.get('/profile/notifications', auth, getNotificationSettings);
router.put('/profile/notifications', auth, updateNotificationSettings);

export default router;