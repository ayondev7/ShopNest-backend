import mongoose, { Schema, Document } from 'mongoose';

export interface ICartItem extends Document {
  customerId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
}

const cartItemSchema = new Schema<ICartItem>({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  }
}, {
  timestamps: true
});

cartItemSchema.index({ customerId: 1, productId: 1 }, { unique: true });

export default mongoose.model<ICartItem>('CartItem', cartItemSchema);
