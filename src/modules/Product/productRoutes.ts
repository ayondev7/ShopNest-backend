import express from 'express';
import auth from '../../middleware/auth.js';
import multer from 'multer';
import { createProduct, getAllProducts, getAllProductsForShop, getProductDetails, getAllProductsById, searchProducts, getSingleProduct, updateProduct, deleteProduct } from './productController.js';

const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.post('/create', auth, upload.array('productImages', 4), createProduct as any);
router.get('/get-all', auth, getAllProducts);
router.get('/shop/get-all', auth, getAllProductsForShop);
router.get('/shop/get-product/:id', auth, getProductDetails);
router.post('/get-all-by-id', auth, getAllProductsById);
router.get('/search', auth, searchProducts);
router.get('/get-product/:id', auth, getSingleProduct);
router.patch('/update-product', auth, upload.array('productImages', 4), updateProduct);
router.delete('/delete/:id', auth, deleteProduct);

export default router;
