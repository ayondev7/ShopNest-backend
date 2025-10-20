import express from 'express';
import * as orderController from '../Order/orderController.js';

const router = express.Router();

router.get('/success', orderController.paymentSuccess);
router.get('/fail', orderController.paymentFail);
router.get('/cancel', orderController.paymentCancel);
router.post('/ipn', (req, res) => {
  res.status(200).send('OK');
});

export default router;
