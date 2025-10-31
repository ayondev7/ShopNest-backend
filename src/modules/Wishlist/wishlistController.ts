import { Response } from 'express';
import * as wishlistService from './wishlistService.js';
import { AuthRequest } from '../../types/index.js';

export const createList = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { customer } = req;
    if (!customer) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { _id: customerId } = customer;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const existing = await wishlistService.findWishlistByCustomerAndTitle(customerId, title);
    if (existing) {
      return res.status(409).json({ message: 'A wishlist with this title already exists' });
    }

    const wishlist = await wishlistService.createWishlist(customerId, title);
    res.status(201).json({ message: 'Wishlist created', wishlist });
  } catch (error: any) {
    console.error('Create list error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const addToList = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { customer } = req;
    if (!customer) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { _id: customerId } = customer;
    const { wishlistId, productId } = req.body;

    if (!wishlistId || !productId) {
      return res.status(400).json({ error: 'wishlistId and productId are required' });
    }

    const existingWishlistWithProduct = await wishlistService.findWishlistWithProduct(customerId, productId);

    if (existingWishlistWithProduct) {
      return res.status(409).json({ 
        message: 'Product already exists in one of your wishlists',
        existingWishlistId: existingWishlistWithProduct._id
      });
    }

    const result = await wishlistService.addProductToWishlistWithActivity(wishlistId, customerId, productId);

    if (!result) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    res.status(200).json({ message: 'Product added to wishlist', wishlist: result });
  } catch (error: any) {
    console.error('Add to list error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getAllLists = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    if (req.seller) {
      return res.status(200).json({ wishlists: [] });
    }

    const { customer } = req;
    if (!customer) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { _id: customerId } = customer;

    const wishlists = await wishlistService.getWishlistsByCustomer(customerId);
    res.status(200).json({ wishlists });
  } catch (error: any) {
    console.error('Error fetching wishlists:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getWishlistItems = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { customer } = req;
    if (!customer) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { _id: customerId } = customer;

    const results = await wishlistService.getWishlistItemsByCustomer(customerId);
    res.status(200).json({ lists: results });
  } catch (error: any) {
    console.error('Error fetching wishlist items:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const removeFromWishlist = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { customer, params, body } = req;
    if (!customer) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { _id: customerId } = customer;
    const { id: wishlistId } = params;
    const { productId } = body;

    const productIdsToRemove = Array.isArray(productId) ? productId : [productId];

    const result = await wishlistService.removeProductsFromWishlistWithActivity(wishlistId, customerId, productIdsToRemove);

    if (!result) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    if (result.deleted) {
      return res.status(200).json({ message: 'Wishlist deleted as it became empty' });
    } else {
      return res.status(200).json({ message: 'Product(s) removed from wishlist' });
    }
  } catch (error: any) {
    console.error('Remove wishlist item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
