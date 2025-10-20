import mongoose, { Schema, Document } from 'mongoose';

export interface ICart extends Document {
  customerId: mongoose.Types.ObjectId;
  title: string;
  productIds: mongoose.Types.ObjectId[];
}

const cartSchema = new Schema<ICart>({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  title: {
    type: String,
    trim: true,
  },
  productIds: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    }
  ]
}, {
  timestamps: true
});

export default mongoose.model<ICart>('Cart', cartSchema);
