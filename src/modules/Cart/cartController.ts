import { Response } from 'express';
import * as cartService from './cartService.js';
import Wishlist from '../Wishlist/wishlistModel.js';
import { AuthRequest } from '../../types/index.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { AuthenticationError, BadRequestError, NotFoundError } from '../../utils/errorClasses.js';

export const addToCart = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  const { customer } = req;
  if (!customer) {
    throw new AuthenticationError('Unauthorized');
  }
  const { _id: customerId } = customer;
  let entries = Array.isArray(req.body) ? req.body : [req.body];

  const added = [];
  const skipped = [];
  const deletedWishlistIds = [];
  const updatedWishlistIds = [];

  for (const entry of entries) {
    const { wishlistId, productId } = entry;

    if (!wishlistId || !productId) {
      skipped.push({ wishlistId, reason: 'Missing wishlistId or productId' });
      continue;
    }

    const wishlist = await Wishlist.findById(wishlistId);
    if (!wishlist) {
      skipped.push({ wishlistId, reason: 'Wishlist not found' });
      continue;
    }

    const productIds = Array.isArray(productId) ? productId : [productId];
    
    try {
      const result = await cartService.processWishlistToCart(customerId, wishlist, productIds);

      added.push(...result.added);
      skipped.push(...result.skipped);

      if (result.productsToRemove.length > 0) {
        const removeResult = await cartService.removeProductsFromWishlist(wishlistId, result.productsToRemove);
        if (removeResult.deleted) {
          deletedWishlistIds.push(wishlistId);
        } else if (removeResult.updated) {
          updatedWishlistIds.push(wishlistId);
        }
      }
    } catch (error: any) {
      console.error('Error processing wishlist to cart:', error);
      skipped.push({ wishlistId, reason: 'Failed to process' });
    }
  }

  res.status(201).json({
    message: 'Processed add to cart request',
    addedCount: added.length,
    skippedCount: skipped.length,
    deletedWishlistIds,
    updatedWishlistIds,
    added,
    skipped,
  });
});

export const addProductDirect = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  const { customer } = req;
  const customerId = customer?._id;
  const { productId } = req.body;

  if (!customerId) {
    throw new AuthenticationError('Unauthorized');
  }

  if (!productId) {
    throw new BadRequestError('productId is required');
  }

  const result = await cartService.addProductToCart(customerId, productId);

  if (!result.success) {
    if (result.error) {
      throw new NotFoundError(result.error);
    }
    return res.status(200).json({ message: result.message });
  }

  return res.status(201).json({ message: 'Product added to cart', cartId: result.cartId });
});

export const getCartItems = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  const { customer } = req;
  if (!customer) {
    throw new AuthenticationError('Unauthorized');
  }
  const { _id: customerId } = customer;

  const carts = await cartService.getCartsByCustomer(customerId);
  const result = cartService.formatCartProducts(carts);

  res.status(200).json(result);
});

export const removeFromCart = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  const { customer, body } = req;
  if (!customer) {
    throw new AuthenticationError('Unauthorized');
  }
  const { _id: customerId } = customer;
  const { cartId, productId } = body;

  if (!productId || (Array.isArray(productId) && productId.length === 0)) {
    throw new BadRequestError('No productId(s) provided');
  }

  if (!cartId || (Array.isArray(cartId) && cartId.length === 0)) {
    throw new BadRequestError('No cartId(s) provided');
  }

  const cartIdsToProcess = Array.isArray(cartId) ? cartId : [cartId];
  const productIdsToRemove = Array.isArray(productId) ? productId : [productId];

  const stats = await cartService.removeProductsFromCarts(customerId, cartIdsToProcess, productIdsToRemove);

  let message = 'Operation completed';
  if (stats.cartsModified > 0 && stats.cartsDeleted > 0) {
    message = `Items removed from ${stats.cartsModified} cart(s) and ${stats.cartsDeleted} empty cart(s) deleted`;
  } else if (stats.cartsModified > 0) {
    message = `Items removed from ${stats.cartsModified} cart(s)`;
  } else if (stats.cartsDeleted > 0) {
    message = `${stats.cartsDeleted} empty cart(s) deleted`;
  } else {
    message = 'No changes made - requested items not found in specified carts';
  }

  res.status(200).json({ message, stats });
});

export const updateCartItemQuantity = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
  const { customer } = req;
  if (!customer) {
    throw new AuthenticationError('Unauthorized');
  }
  const { _id: customerId } = customer;
  const { id, quantity } = req.body;

  if (!id || !quantity) {
    throw new BadRequestError('Product ID and quantity are required');
  }

  if (quantity < 1) {
    throw new BadRequestError('Quantity must be at least 1');
  }

  const cartItem = await cartService.updateCartItemQuantity(customerId, id, quantity);

  res.status(200).json({
    message: 'Cart item quantity updated successfully',
    cartItem: {
      _id: cartItem._id,
      productId: cartItem.productId,
      quantity: cartItem.quantity
    }
  });
});
