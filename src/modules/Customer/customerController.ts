import { Response, NextFunction } from 'express';
import Customer from './customerModel.js';
import * as customerService from './customerService.js';
import { validationResult } from 'express-validator';
import { createCustomerValidators, loginCustomerValidators } from './customerValidation.js';
import { generateToken, comparePassword } from '../../utils/authUtils.js';
import { AuthRequest } from '../../types/index.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ValidationError, AuthenticationError, NotFoundError, ConflictError } from '../../utils/errorClasses.js';

export const createCustomer = [
  ...createCustomerValidators,

  asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new ValidationError(errors.array()[0].msg);

    const { email } = req.body;
    const existingCustomer = await customerService.findCustomerByEmail(email);
    if (existingCustomer) throw new ConflictError('Email already exists');

    const customer = await customerService.createCustomer(req.body, req.file);

    const token = generateToken({ customerId: customer._id });

    res.status(201).json({
      token,
      customerId: customer._id,
      firstName: customer.firstName,
      lastName: customer.lastName
    });
  })
];

export const loginCustomer = [
  ...loginCustomerValidators,

  asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const { email, password } = req.body;

    const customer = await Customer.findOne({ email }).select('+password');
    if (!customer) {
      throw new AuthenticationError('Incorrect Email! Please try again.');
    }

    const isMatch = await comparePassword(password, customer.password);
    if (!isMatch) {
      throw new AuthenticationError('Incorrect Password! Please try again.');
    }

    const token = generateToken({ customerId: customer._id });

    const customerObj: any = customer.toObject();
    delete customerObj.password;
    delete customerObj.customerImage;

    return res.status(200).json({
      accessToken: token,
      customer: customerObj,
    });
  })
];

export const getCustomerProfileInfo = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  if (!req.customer) {
    throw new AuthenticationError('Unauthorized');
  }

  const customer = await customerService.findCustomerById(req.customer._id);
  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  const responseData = customerService.formatCustomerProfileInfo(customer.toObject());
  return res.status(200).json(responseData);
});

export const getCustomerProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  const { customer } = req;

  if (!customer || !customer._id) {
    throw new AuthenticationError('Unauthorized: Customer not found in request');
  }

  const foundCustomer = await customerService.findCustomerById(customer._id);

  if (!foundCustomer) {
    throw new NotFoundError('Customer not found');
  }

  return res.status(200).json({
    success: true,
    data: customerService.formatCustomerProfile(foundCustomer),
  });
});

export const updateCustomer = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  if (!req.customer) {
    throw new AuthenticationError('Unauthorized');
  }

  const customer = await customerService.updateCustomerProfile(req.customer._id, req.body, req.file);
  if (!customer) throw new NotFoundError('Customer not found');

  const responseData = customerService.formatCustomerProfileInfo(customer.toObject());
  res.status(200).json(responseData);
});

export const getAllCustomers = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  const customers = await Customer.find().select('-password');

  const customersWithImages = customers.map((customer: any) =>
    customerService.formatCustomerProfileInfo(customer.toObject())
  );

  res.status(200).json(customersWithImages);
});

export const getCustomerStats = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  if (!req.customer) {
    throw new AuthenticationError('Unauthorized');
  }

  const stats = await customerService.getCustomerStats(req.customer._id);
  res.status(200).json(stats);
});

export const getActivitiesByCustomer = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  const { customer } = req;
  const customerId = customer?._id;

  if (!customerId) {
    throw new AuthenticationError('Customer ID is required');
  }

  const activities = await customerService.getCustomerActivities(customerId);
  res.status(200).json({ success: true, activities });
});

export const getAllNotifications = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  const { customer } = req;
  const customerId = customer?._id;

  if (!customerId) {
    throw new AuthenticationError('Customer ID is required');
  }

  const notifications = await customerService.getCustomerNotifications(customerId);
  res.status(200).json({ success: true, notifications });
});

export const markNotificationsAsSeen = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  const { customer } = req;
  const { notificationId } = req.body;

  if (!customer || !customer._id) {
    throw new AuthenticationError('Unauthorized');
  }

  if (!notificationId) {
    throw new ValidationError('Notification ID is required');
  }

  await customerService.markNotificationsAsSeen(customer._id, notificationId);
  res.status(200).json({ success: true, message: 'Notifications marked as seen.' });
});

export const guestCustomerLogin = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  const guestEmail = process.env.GUEST_CUSTOMER_EMAIL;
  const guestPassword = process.env.GUEST_PASSWORD;

  if (!guestEmail || !guestPassword) {
    throw new Error('Guest credentials are not configured');
  }

  const customer = await Customer.findOne({ email: guestEmail }).select('+password');
  if (!customer) {
    throw new NotFoundError('Guest customer not found');
  }

  const isMatch = await comparePassword(guestPassword, customer.password);
  if (!isMatch) {
    throw new AuthenticationError('Guest authentication failed');
  }

  const token = generateToken({ customerId: customer._id });

  const customerObj: any = customer.toObject();
  delete customerObj.password;
  delete customerObj.customerImage;

  return res.status(200).json({ accessToken: token, customer: customerObj });
});
