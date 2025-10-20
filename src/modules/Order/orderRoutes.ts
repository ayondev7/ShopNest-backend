import express from 'express';
import auth from '../../middleware/auth.js';
import * as orderController from './orderController.js';

const router = express.Router();

router.post('/add-order', auth, orderController.AddOrder);
router.get('/get-all', auth, orderController.getAllOrders);
router.get('/get-seller-orders', auth, orderController.getSellerOrders);
router.get('/get-seller-order/:id', auth, orderController.getOrderById);
router.get('/get-payments', auth, orderController.getAllPayments);
router.patch('/update-status/:orderId', auth, orderController.updateOrderStatus);
router.get('/get-order-status-counts', auth, orderController.getOrderStatusCounts);

export default router;
