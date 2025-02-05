import express from 'express';
import { getAllCategories, getRootCategories, getSubCategories } from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', getAllCategories);
router.get('/root', getRootCategories);
router.get('/:parent_id', getSubCategories);

export default router;