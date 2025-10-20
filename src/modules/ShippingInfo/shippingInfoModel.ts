import mongoose, { Schema, Document } from 'mongoose';

export interface IShippingInfo extends Document {
  customerId: mongoose.Types.ObjectId;
  fullName: string;
  phoneNumber: string;
  email: string;
  addressId: mongoose.Types.ObjectId;
  optionalAddressId?: mongoose.Types.ObjectId | null;
}

const shippingInfoSchema = new Schema<IShippingInfo>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    addressId: {
      type: Schema.Types.ObjectId,
      ref: 'Address',
      required: true,
    },
    optionalAddressId: {
      type: Schema.Types.ObjectId,
      ref: 'Address',
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IShippingInfo>('ShippingInfo', shippingInfoSchema);
