import { Response } from 'express';
import * as addressService from './addressService.js';
import { AuthRequest } from '../../types/index.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AuthenticationError, NotFoundError } from '../../utils/errorClasses.js';

export const addAddress = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  if (!req.customer) {
    throw new AuthenticationError('Unauthorized');
  }
  const address = await addressService.createAddress(req.customer._id, req.body);
  res.status(201).json(address);
});

export const getAllAddresses = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  if (!req.customer) {
    throw new AuthenticationError('Unauthorized');
  }
  const addresses = await addressService.getAddressesByCustomer(req.customer._id);
  res.status(200).json(addresses);
});

export const updateAddress = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  if (!req.customer) {
    throw new AuthenticationError('Unauthorized');
  }
  const address = await addressService.updateAddressById(req.params.id, req.customer._id, req.body);
  if (!address) throw new NotFoundError('Address not found');
  res.status(200).json(address);
});

export const deleteAddress = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  if (!req.customer) {
    throw new AuthenticationError('Unauthorized');
  }
  const result = await addressService.deleteAddressById(req.params.id, req.customer._id);
  if (!result) throw new NotFoundError('Address not found');
  res.status(200).json({ message: 'Address deleted successfully' });
});

export const setDefaultAddress = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  if (!req.customer) {
    throw new AuthenticationError('Unauthorized');
  }
  const updated = await addressService.setAddressAsDefault(req.params.id, req.customer._id);
  if (!updated) throw new NotFoundError('Address not found');
  res.status(200).json(updated);
});
