import Wishlist from './wishlistModel.js';
import Product from '../Product/productModel.js';
import RecentActivity from '../RecentActivity/recentActivityModel.js';
import { Types } from 'mongoose';

export async function createWishlist(customerId: Types.ObjectId | string, title: string): Promise<any> {
  const wishlist = new Wishlist({
    customerId,
    title,
    productIds: [],
  });

  await wishlist.save();
  return wishlist;
}

export async function findWishlistByCustomerAndTitle(customerId: Types.ObjectId | string, title: string): Promise<any> {
  return await Wishlist.findOne({ customerId, title });
}

export async function findWishlistWithProduct(customerId: Types.ObjectId | string, productId: string): Promise<any> {
  return await Wishlist.findOne({ 
    customerId, 
    productIds: productId 
  });
}

export async function addProductToWishlist(wishlistId: string, customerId: Types.ObjectId | string, productId: string): Promise<any> {
  const wishlist = await Wishlist.findOne({ _id: wishlistId, customerId });
  if (!wishlist) return null;
  
  wishlist.productIds.push(productId as any);
  await wishlist.save();
  return wishlist;
}

export async function getWishlistsByCustomer(customerId: Types.ObjectId | string): Promise<any[]> {
  return await Wishlist.find({ customerId }).select('-__v');
}

export async function getWishlistItemsByCustomer(customerId: Types.ObjectId | string): Promise<any[]> {
  const wishlists = await Wishlist.find({ customerId })
    .populate({
      path: 'productIds',
      select: 'title price quantity colour model productImages'
    });

  return wishlists.map((list: any) => ({
    title: list.title,
    _id: list._id,
    products: list.productIds.map((product: any) => ({
      _id: product._id,
      title: product.title,
      price: product.price,
      stock: product.quantity,
      colour: product.colour,
      model: product.model,
      image: product.productImages?.length > 0 ? product.productImages[0] : null
    }))
  }));
}

export async function removeProductsFromWishlist(wishlistId: string, customerId: Types.ObjectId | string, productIds: string[]): Promise<any> {
  const wishlist = await Wishlist.findOne({
    _id: wishlistId,
    customerId,
  });

  if (!wishlist) return null;

  wishlist.productIds = wishlist.productIds.filter(
    (pid: any) => !productIds.includes(pid.toString())
  );

  if (wishlist.productIds.length === 0) {
    await Wishlist.deleteOne({ _id: wishlistId });
    return { deleted: true };
  } else {
    await wishlist.save();
    return { deleted: false, wishlist };
  }
}

export async function createWishlistActivity(customerId: Types.ObjectId | string, wishlistId: string, activityType: string, productTitle: string): Promise<void> {
  await RecentActivity.create({
    customerId,
    wishlistId,
    activityType,
    activityStatus: activityType === 'added to wishlist' 
      ? `You added '${productTitle}' to your wishlist`
      : `You removed '${productTitle}' from your wishlist`,
  });
}

export async function getProductTitle(productId: string): Promise<string> {
  const product = await Product.findById(productId).select('title');
  return product ? product.title : 'the product';
}
