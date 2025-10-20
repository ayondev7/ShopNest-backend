import mongoose, { Schema, Document } from 'mongoose';

export interface IAddress extends Document {
  customerId: mongoose.Types.ObjectId;
  name: string;
  addressLine: string;
  city: string;
  zipCode: string;
  country: string;
  state: string;
  isDefault: boolean;
}

const addressSchema = new Schema<IAddress>({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  addressLine: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  zipCode: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  isDefault: {  
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model<IAddress>('Address', addressSchema);
