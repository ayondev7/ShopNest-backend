import { Response } from 'express';
import * as addressService from './addressService.js';
import { AuthRequest } from '../../types/index.js';

export const addAddress = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.customer) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const address = await addressService.createAddress(req.customer._id, req.body);
    res.status(201).json(address);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllAddresses = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.customer) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const addresses = await addressService.getAddressesByCustomer(req.customer._id);
    res.status(200).json(addresses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAddress = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.customer) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const address = await addressService.updateAddressById(req.params.id, req.customer._id, req.body);
    if (!address) return res.status(404).json({ error: 'Address not found' });
    res.status(200).json(address);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAddress = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.customer) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const result = await addressService.deleteAddressById(req.params.id, req.customer._id);
    if (!result) return res.status(404).json({ error: 'Address not found' });
    res.status(200).json({ message: 'Address deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const setDefaultAddress = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (!req.customer) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const updated = await addressService.setAddressAsDefault(req.params.id, req.customer._id);
    if (!updated) return res.status(404).json({ error: 'Address not found' });
    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
