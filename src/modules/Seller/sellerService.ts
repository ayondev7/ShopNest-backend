import { Response } from 'express';
import Seller from './sellerModel.js';
import SellerNotification from '../SellerNotification/sellerNotificationModel.js';
import Product from '../Product/productModel.js';
import Order from '../Order/orderModel.js';
import { processAndUploadImage } from '../../utils/imageKitUtils.js';
import { hashPassword } from '../../utils/authUtils.js';
import { ISeller } from '../../types/index.js';
import { Types } from 'mongoose';

export async function findSellerByEmail(email: string): Promise<ISeller | null> {
  return await Seller.findOne({ email });
}

export async function findSellerById(sellerId: Types.ObjectId | string): Promise<ISeller | null> {
  return await Seller.findById(sellerId);
}

export async function createSeller(sellerData: any, imageFile: any): Promise<ISeller> {
  const { name, email, password, phone } = sellerData;

  let sellerImageUrl: string | null = null;
  if (imageFile) {
    const fileName = `${name.replace(/\s+/g, '_')}_${Date.now()}.webp`;
    sellerImageUrl = await processAndUploadImage(imageFile.buffer, fileName);
  }

  const hashedPassword = await hashPassword(password, 10);

  const seller = new Seller({
    name,
    email,
    phone,
    lastNotificationSeen: null,
    password: hashedPassword,
    sellerImage: sellerImageUrl,
  });

  await seller.save();
  return seller;
}

export async function getSellerNotifications(sellerId: Types.ObjectId | string): Promise<any[]> {
  const seller = await Seller.findById(sellerId);
  const lastSeenId = seller?.lastNotificationSeen;

  const notifications = await SellerNotification.find({ sellerId }).sort({ createdAt: -1 });

  return notifications.map((notification: any) => ({
    ...notification.toObject(),
    isNew: lastSeenId ? notification._id > lastSeenId : true,
  }));
}

export async function updateLastNotificationSeen(sellerId: Types.ObjectId | string, lastSeenNotificationId: Types.ObjectId | string): Promise<void> {
  await Seller.findByIdAndUpdate(sellerId, {
    lastNotificationSeen: lastSeenNotificationId,
  });
}

export async function getSellerPayments(sellerId: Types.ObjectId | string): Promise<any[]> {
  const sellerProducts = await Product.find({ sellerId }).select('_id title').lean();

  const productIdToTitleMap: any = {};
  const sellerProductIds = sellerProducts.map((product: any) => {
    productIdToTitleMap[product._id.toString()] = product.title;
    return product._id;
  });

  const orders = await Order.find({
    productId: { $in: sellerProductIds },
  }).lean();

  return orders.map((order: any) => ({
    ...order,
    productTitle: productIdToTitleMap[order.productId.toString()] || null,
  }));
}

export function formatSellerProfile(seller: ISeller): any {
  const { password, sellerImage, ...rest } = seller.toObject();
  return {
    ...rest,
    image: sellerImage || null,
  };
}

export function formatSellerData(seller: ISeller): any {
  const { password, sellerImage, ...sellerData } = seller.toObject();
  return sellerData;
}
