import { Router } from 'express'
import auth from '../middlewares/authMiddleware.js'
import { changePassword, createUser, login, resendOTP, verifyOTP } from '../controllers/authController.js'

const router = Router()

router.post('/create-user', createUser)
router.post('/login', login)
router.post('/verify-otp', verifyOTP)
router.post('/resend-otp', resendOTP)

router.put('/update-password', auth, changePassword)

export default router