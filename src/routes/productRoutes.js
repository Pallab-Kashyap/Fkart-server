import express from 'express';
import {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  searchProducts,
  getRelatedProducts,
  getProductVariationsStock, // Add this import
} from '../controllers/productController.js';

const router = express.Router();

router.get('/', getAllProducts);
router.get('/search', searchProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProductById);
router.get('/:id/related', getRelatedProducts);
router.post('/variations/stock', getProductVariationsStock); // Changed from GET to POST

export default router;
