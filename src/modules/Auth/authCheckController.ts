import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Seller from '../Seller/sellerModel';
import Customer from '../Customer/customerModel';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AuthenticationError } from '../../utils/errorClasses.js';

export const getUserType = asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('No token provided');
  }

  const token = authHeader.split(' ')[1];
  const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

  if (decoded.sellerId) {
    const seller = await Seller.findById(decoded.sellerId).select('_id');
    if (seller) {
      return res.status(200).json({ userType: 'seller', userId: seller._id });
    }
  }

  if (decoded.customerId) {
    const customer = await Customer.findById(decoded.customerId).select('_id');
    if (customer) {
      return res.status(200).json({ userType: 'customer', userId: customer._id });
    }
  }

  throw new AuthenticationError('Invalid token: user not found');
});
