import express from 'express';
import * as authController from './authController.js';
import * as authCheckController from './authCheckController.js';

const router = express.Router();

router.get('/auth-check', authCheckController.getUserType);

export default router;
