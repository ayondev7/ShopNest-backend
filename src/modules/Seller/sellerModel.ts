import mongoose, { Schema } from 'mongoose';
import { ISeller } from '../../types/index.js';

const sellerSchema = new Schema<ISeller>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v: string) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: "Please enter a valid email"
    }
  },
   phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(v);
      },
      message: "Please enter a valid phone number"
    }
  },
  password: {
    type: String,
    required: true
  },
  lastNotificationSeen: {
  type: Schema.Types.ObjectId,
  ref: 'SellerNotification',
  default: null
},
  sellerImage: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model<ISeller>('Seller', sellerSchema);
