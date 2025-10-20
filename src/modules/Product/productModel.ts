import mongoose, { Schema } from 'mongoose';

export interface IProduct {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description: string;
  productImages: string[];
  category: string;
  brand: string;
  model: string;
  storage: string;
  colour: string;
  ram: string;
  conditions: string[];
  features: string[];
  specifications: { label: string; value: string }[];
  price: number;
  salePrice?: number;
  quantity: number;
  sku: string;
  negotiable: boolean;
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  sellerId: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const productSchema = new Schema<IProduct>({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  productImages: [{ type: String }],
  category: { type: String, required: true, trim: true },
  brand: { type: String, trim: true, required: true },
  model: { type: String, trim: true, required: true },
  storage: { type: String, trim: true, required: true },
  colour: { type: String, trim: true, required: true },
  ram: { type: String, trim: true, required: true },
  conditions: [{ type: String, trim: true, required: true }],
  features: [{ type: String, trim: true, required: true }],
  specifications: [
    {
      label: { type: String, trim: true, required: true },
      value: { type: String, trim: true, required: true }
    }
  ],
  price: { type: Number, required: true },
  salePrice: { type: Number },
  quantity: { type: Number, required: true },
  sku: { type: String, unique: true, trim: true },
  negotiable: { type: Boolean, default: false },
  tags: [{ type: String, trim: true }],
  seoTitle: { type: String, trim: true },
  seoDescription: { type: String, trim: true },
  sellerId: {
    type: Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  }
}, {
  timestamps: true
});

productSchema.path('productImages').validate(function (value: string[]) {
  return Array.isArray(value) ? value.length <= 4 : true;
}, 'A product can have at most 4 images.');

export default mongoose.model<IProduct>('Product', productSchema);
