import { Response } from 'express';
import Seller from './sellerModel.js';
import * as sellerService from './sellerService.js';
import { validationResult } from 'express-validator';
import { createSellerValidators, loginSellerValidators } from './sellerValidation.js';
import { generateToken, comparePassword } from '../../utils/authUtils.js';
import { AuthRequest } from '../../types/index.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ValidationError, AuthenticationError, NotFoundError, ConflictError, BadRequestError } from '../../utils/errorClasses.js';

export const createSeller = [
  ...createSellerValidators,

  asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const { email } = req.body;

    if (!req.file) {
      throw new BadRequestError('Seller image is required');
    }

    const existingSeller = await sellerService.findSellerByEmail(email);
    if (existingSeller) {
      throw new ConflictError('Email already in use');
    }

    const seller = await sellerService.createSeller(req.body, req.file);
    const accessToken = generateToken({ sellerId: seller._id });

    res.status(201).json({
      accessToken,
      sellerId: seller._id,
    });
  }),
];

export const loginSeller = [
  ...loginSellerValidators,

  asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const { email, password } = req.body;

    const seller = await Seller.findOne({ email }).select('+password');
    if (!seller) {
      throw new AuthenticationError('Invalid email');
    }

    const isPasswordValid = await comparePassword(password, seller.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid password');
    }

    const accessToken = generateToken({ sellerId: seller._id });
    const sellerData = sellerService.formatSellerData(seller);

    res.status(200).json({
      accessToken,
      seller: sellerData,
    });
  }),
];

export const getAllSellers = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  const sellers = await Seller.find().select('-password');

  const sellersWithImages = sellers.map((seller: any) => {
    const { sellerImage, ...sellerData } = seller.toObject();
    return {
      ...sellerData,
      sellerImage: sellerImage || null,
    };
  });

  res.status(200).json(sellersWithImages);
});

export const getSellerProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  const { seller } = req;

  if (!seller || !seller._id) {
    throw new AuthenticationError('Unauthorized: Seller not found in request');
  }

  const foundSeller = await sellerService.findSellerById(seller._id);

  if (!foundSeller) {
    throw new NotFoundError('Seller not found');
  }

  return res.status(200).json({
    success: true,
    data: sellerService.formatSellerProfile(foundSeller),
  });
});

export const getSellerNotifications = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  const sellerId = req.seller?._id;

  if (!sellerId) {
    throw new AuthenticationError('Unauthorized');
  }

  const notifications = await sellerService.getSellerNotifications(sellerId);
  res.status(200).json({ success: true, notifications });
});

export const updateLastNotificationSeen = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  const sellerId = req.seller?._id;
  const { lastSeenNotificationId } = req.body;

  if (!sellerId || !lastSeenNotificationId) {
    throw new BadRequestError('Missing seller ID or notification ID');
  }

  await sellerService.updateLastNotificationSeen(sellerId, lastSeenNotificationId);

  res.status(200).json({
    success: true,
    message: 'Last seen notification updated successfully',
  });
});

export const getSellerPayments = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  const { seller } = req;
  const sellerId = seller?._id;

  if (!sellerId) {
    throw new BadRequestError('Seller ID is required');
  }

  const payments = await sellerService.getSellerPayments(sellerId);
  res.status(200).json({ success: true, payments });
});

export const guestSellerLogin = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  const guestEmail = process.env.GUEST_SELLER_EMAIL;
  const guestPassword = process.env.GUEST_PASSWORD;

  if (!guestEmail || !guestPassword) {
    throw new Error('Guest credentials are not configured');
  }

  const seller = await Seller.findOne({ email: guestEmail }).select('+password');
  if (!seller) {
    throw new NotFoundError('Guest seller not found');
  }

  const isMatch = await comparePassword(guestPassword, seller.password);
  if (!isMatch) {
    throw new AuthenticationError('Guest authentication failed');
  }

  const accessToken = generateToken({ sellerId: seller._id });
  const sellerData = sellerService.formatSellerData(seller);

  return res.status(200).json({ accessToken, seller: sellerData });
});
