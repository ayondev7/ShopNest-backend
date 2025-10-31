import { Request, Response } from 'express';
import * as productService from './productService';
import { validationResult } from 'express-validator';
import { baseProductValidators } from './productValidation';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ValidationError, AuthorizationError, BadRequestError, NotFoundError, ConflictError } from '../../utils/errorClasses.js';

export const createProduct = [
  ...baseProductValidators,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array()[0].msg);
    }

    const seller = (req as any).seller;
    if (!seller || !seller._id) {
      throw new AuthorizationError('Unauthorized!');
    }

    if (!req.files || (req.files as any[]).length === 0) {
      throw new BadRequestError('At least one product image is required');
    }

    if ((req.files as any[]).length > 4) {
      throw new BadRequestError('Maximum 4 images allowed');
    }

    const product = await productService.createProduct(req.body, req.files as any[], seller._id);

    res.status(201).json({ message: 'Product created successfully', productId: product._id });
  }),
];

export const getAllProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const seller = (req as any).seller;
  if (!seller || !seller._id) {
    throw new AuthorizationError('Unauthorized!');
  }
  const sellerId = seller._id;
  
  const products = await productService.getProductsBySeller(sellerId);
  res.status(200).json({ products });
});

export const getAllProductsById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { products } = req.body;

  if (!products || !Array.isArray(products) || products.length === 0) {
    throw new BadRequestError('No products provided');
  }

  const productIds = products.map((p: any) => p.productId || p.id);
  const formattedProducts = await productService.getProductsByIds(productIds, products);

  res.status(200).json({ products: formattedProducts });
});

export const getAllProductsForShop = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page = 1, limit = 20, category, priceRange, priceMin, priceMax, sortBy = 'newest' } = req.query;

  let parsedPriceMin = priceMin;
  let parsedPriceMax = priceMax;
  if (priceRange) {
    try {
      if (typeof priceRange === 'string' && priceRange.includes('-')) {
        const parts = priceRange.split('-').map((p) => p.trim());
        if (parts[0]) parsedPriceMin = parts[0];
        if (parts[1]) parsedPriceMax = parts[1];
      } else {
        const parsed = JSON.parse(priceRange as string);
        if (Array.isArray(parsed)) {
          parsedPriceMin = parsed[0];
          parsedPriceMax = parsed[1];
        }
      }
    } catch (err) {}
  }

  const filters = {
    category: category as string,
    priceMin: parsedPriceMin as string,
    priceMax: parsedPriceMax as string,
    sortBy: sortBy as string,
  };

  const pagination = { page: page as string, limit: limit as string };
  const customerId = (req as any).customer?._id;

  const result = await productService.getProductsForShop(filters, pagination, customerId);

  res.status(200).json(result);
});

export const getProductDetails = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const product = await productService.getProductDetails(id);

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  res.status(200).json(product);
});

export const searchProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!(req as any).seller && !(req as any).customer) {
    throw new AuthorizationError('Unauthorized!');
  }

  const { category, keyword } = req.query;

  if (!keyword || String(keyword).trim() === '') {
    res.status(200).json({ products: [] });
    return;
  }

  const products = await productService.searchProducts(String(keyword), category as string);
  res.status(200).json({ products });
});

export const getSingleProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const sellerId = (req as any).seller?._id;

  if (!sellerId) {
    throw new AuthorizationError('Unauthorized');
  }

  const product = await productService.getSingleProduct(id, sellerId);

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  res.status(200).json(product);
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const seller = (req as any).seller;
  const { _id: sellerId } = seller;
  const { id: productId } = req.params;

  if (!sellerId) {
    throw new AuthorizationError('Unauthorized');
  }

  const product = await productService.deleteProduct(productId, sellerId);

  if (!product) {
    throw new NotFoundError('Product not found or not authorized');
  }

  res.status(200).json({ message: 'Product deleted successfully' });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { productId, retainedImageUrls } = req.body;

  if (!productId) {
    throw new BadRequestError('Product ID is required');
  }

  const updateData = productService.formatProductForUpdate(req.body);

  let parsedRetainedUrls: string[] = [];
  if (retainedImageUrls) {
    try {
      parsedRetainedUrls = JSON.parse(retainedImageUrls);
    } catch (error) {}
  }

  const updatedProduct = await productService.updateProduct(productId, updateData, req.files as any[], parsedRetainedUrls);

  if (!updatedProduct) {
    throw new NotFoundError('Product not found');
  }

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    product: updatedProduct,
    imageUpdateSummary: {
      totalImages: updatedProduct.productImages.length,
      newImagesAdded: (req.files as any[])?.length || 0,
      existingImagesRetained: updatedProduct.productImages.length - ((req.files as any[])?.length || 0),
    },
  });
});
