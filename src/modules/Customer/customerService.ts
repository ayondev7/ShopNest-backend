import Customer from './customerModel.js';
import Order from '../Order/orderModel.js';
import Wishlist from '../Wishlist/wishlistModel.js';
import RecentActivity from '../RecentActivity/recentActivityModel.js';
import { processAndUploadImage } from '../../utils/imageKitUtils.js';
import { hashPassword } from '../../utils/authUtils.js';
import { ICustomer } from '../../types/index.js';
import { Types } from 'mongoose';
import mongoose from 'mongoose';

export async function findCustomerByEmail(email: string): Promise<ICustomer | null> {
  return await Customer.findOne({ email });
}

export async function findCustomerById(customerId: Types.ObjectId | string): Promise<ICustomer | null> {
  return await Customer.findById(customerId);
}

export async function createCustomer(customerData: any, imageFile: any): Promise<ICustomer> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { firstName, lastName, email, password, phone, bio } = customerData;

    let customerImage: string | undefined;
    if (imageFile) {
      const fileName = `${firstName ? firstName.replace(/\s+/g, '_') : 'customer'}_${Date.now()}.webp`;
      const imageUrl = await processAndUploadImage(imageFile.buffer, fileName);
      if (imageUrl) {
        customerImage = imageUrl;
      }
    }

    const hashedPassword = await hashPassword(password);

    const customer = new Customer({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      lastNotificationSeen: null,
      bio,
      ...(customerImage && { customerImage }),
    });

    await customer.save({ session });
    await session.commitTransaction();
    session.endSession();
    
    return customer;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

export async function updateCustomerProfile(customerId: Types.ObjectId | string, updates: any, imageFile?: any): Promise<ICustomer | null> {
  const updateData: any = { ...updates };

  if (imageFile) {
    const customer = await findCustomerById(customerId);
    const fileName = `${customer?.firstName ? customer.firstName.replace(/\s+/g, '_') : 'customer'}_${Date.now()}.webp`;
    const imageUrl = await processAndUploadImage(imageFile.buffer, fileName);
    if (imageUrl) {
      updateData.customerImage = imageUrl;
    }
  }

  if (updateData.password) {
    updateData.password = await hashPassword(updateData.password);
  }

  return await Customer.findByIdAndUpdate(
    customerId,
    updateData,
    { new: true }
  ).select('-password');
}

export async function getCustomerStats(customerId: Types.ObjectId | string): Promise<any> {
  const totalOrders = await Order.countDocuments({ customerId });
  const pendingOrders = await Order.countDocuments({
    customerId,
    orderStatus: 'pending',
  });
  
  const wishlists = await Wishlist.find({ customerId }, 'productIds');
  const totalWishlistItems = wishlists.reduce(
    (total, wl) => total + (wl.productIds?.length || 0),
    0
  );

  return {
    totalOrders,
    pendingOrders,
    totalWishlistItems,
  };
}

export async function getCustomerActivities(customerId: Types.ObjectId | string): Promise<any[]> {
  return await RecentActivity.find({ customerId }).sort({ createdAt: -1 });
}

export async function getCustomerNotifications(customerId: Types.ObjectId | string): Promise<any[]> {
  const customer = await Customer.findById(customerId).select('lastNotificationSeen');
  const lastSeenId = customer?.lastNotificationSeen;

  const activities = await RecentActivity.find({ customerId }).sort({ createdAt: -1 });

  return activities.map((activity) => ({
    ...activity.toObject(),
    isNew: !lastSeenId || (activity._id as any).toString() > lastSeenId.toString(),
  }));
}

export async function markNotificationsAsSeen(customerId: Types.ObjectId | string, notificationId: Types.ObjectId | string): Promise<void> {
  await Customer.findByIdAndUpdate(customerId, {
    lastNotificationSeen: notificationId,
  });
}

export function formatCustomerProfile(customer: ICustomer): any {
  const { password, customerImage, firstName, lastName, ...rest } = customer.toObject();
  return {
    ...rest,
    name: `${firstName} ${lastName}`,
    image: customerImage || null,
  };
}

export function formatCustomerProfileInfo(customer: any): any {
  const { customerImage, ...profile } = customer;
  return {
    ...profile,
    customerImage: customerImage || null
  };
}
