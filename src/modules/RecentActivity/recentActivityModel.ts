import mongoose, { Schema, Document } from 'mongoose';

export interface IRecentActivity extends Document {
  customerId: mongoose.Types.ObjectId;
  wishlistId?: mongoose.Types.ObjectId;
  orderId?: mongoose.Types.ObjectId;
  activityType: string;
  activityStatus: string;
}

const recentActivitySchema = new Schema<IRecentActivity>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    wishlistId: {
      type: Schema.Types.ObjectId,
      ref: 'Wishlist',
      required: false,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: false,
    },
    activityType: {
      type: String,
      required: true,
      trim: true,
    },
    activityStatus: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IRecentActivity>('RecentActivity', recentActivitySchema);
