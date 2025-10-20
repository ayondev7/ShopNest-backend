import express from 'express';
import auth from '../../middleware/auth.js';
import * as wishlistController from './wishlistController.js';

const router = express.Router();

router.post('/add-to-list', auth, wishlistController.addToList);
router.post('/create-list', auth, wishlistController.createList);
router.get('/get-all-lists', auth, wishlistController.getAllLists);
router.get('/get-all', auth, wishlistController.getWishlistItems);
router.delete('/delete-wishlist-item/:id', auth, wishlistController.removeFromWishlist);

export default router;
