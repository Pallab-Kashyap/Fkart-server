
import express from 'express';
import { getRootCategories, getSubCategories } from '../controllers/categoryController.js';

const router = express.Router();

router.get('/', getRootCategories);
router.get('/:categoryId/subcategories', getSubCategories);

export default router;