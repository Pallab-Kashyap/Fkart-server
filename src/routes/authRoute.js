import { Router } from 'express'
import auth from '../middlewares/authMiddleware.js'
import { changePassword, createUser, refreshAccessToken, login, logout, resendOTP, verifyOTP } from '../controllers/authController.js'

const router = Router()

router.post('/create-user', createUser)
router.post('/login', login)
router.post('/verify-otp', verifyOTP)
router.post('/resend-otp', resendOTP)
router.post('/refresh-access-token', refreshAccessToken)

router.put('/update-password', auth, changePassword)
router.get('/logout', auth, logout)

export default router