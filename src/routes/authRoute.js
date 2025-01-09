import { Router } from 'express'
import auth from '../middlewares/authMiddleware.js'
import { changePassword, createUser, login } from '../controllers/authController.js'

const router = Router()

router.post('/create-user', createUser)
router.post('/login', login)

router.put('/update-password', auth, changePassword)

export default router