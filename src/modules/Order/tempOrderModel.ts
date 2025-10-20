import mongoose, { Schema, Document } from 'mongoose';

interface ITempOrder extends Document {
  customerId: mongoose.Types.ObjectId;
  orders: mongoose.Types.ObjectId[];
  shippingInfoId: mongoose.Types.ObjectId;
  addressIds: {
    primary: mongoose.Types.ObjectId;
    optional?: mongoose.Types.ObjectId;
  };
  checkoutPayload: any;
  products: any[];
  expiresAt: Date;
}

const tempOrderSchema = new Schema<ITempOrder>({
  customerId: { type: Schema.Types.ObjectId, required: true },
  orders: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
  shippingInfoId: { type: Schema.Types.ObjectId, required: true },
  addressIds: {
    primary: Schema.Types.ObjectId,
    optional: Schema.Types.ObjectId,
  },
  checkoutPayload: Schema.Types.Mixed,
  products: [Schema.Types.Mixed],
  expiresAt: { type: Date, default: Date.now, expires: 3600 },
});

export const TempOrder = mongoose.models.TempOrder || mongoose.model<ITempOrder>('TempOrder', tempOrderSchema);
