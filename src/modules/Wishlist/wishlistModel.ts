import mongoose, { Schema, Document } from 'mongoose';

export interface IWishlist extends Document {
  customerId: mongoose.Types.ObjectId;
  title: string;
  productIds: mongoose.Types.ObjectId[];
}

const wishlistSchema = new Schema<IWishlist>({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    unique: true
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

export default mongoose.model<IWishlist>('Wishlist', wishlistSchema);
