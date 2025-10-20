import mongoose, { Schema, Document } from 'mongoose';

export interface ISellerNotification extends Document {
  notificationType: string;
  orderId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  description?: string;
  timestamp: Date;
}

const sellerNotificationSchema = new Schema<ISellerNotification>({
  notificationType: {
    type: String,
    required: true,
    trim: true
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model<ISellerNotification>('SellerNotification', sellerNotificationSchema);
