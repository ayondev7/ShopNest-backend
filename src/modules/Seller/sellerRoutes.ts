import express from 'express';
import auth from '../../middleware/auth.js';
import * as sellerController from './sellerController.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req: any, file: any, cb: any) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  }
});

router.post('/register', upload.single('sellerImage'), sellerController.createSeller as any);
router.post('/login', sellerController.loginSeller as any);
router.post('/guest-login', sellerController.guestSellerLogin);
router.get('/get-all-sellers', auth, sellerController.getAllSellers);
router.get('/get-profile', auth, sellerController.getSellerProfile);
router.get('/get-notifications', auth, sellerController.getSellerNotifications);
router.patch('/update-notification', auth, sellerController.updateLastNotificationSeen);
router.get('/get-payments', auth, sellerController.getSellerPayments);

export default router;
