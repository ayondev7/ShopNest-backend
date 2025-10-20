import mongoose, { Schema } from 'mongoose';
import { ICustomer } from '../../types/index.js';

const customerSchema = new Schema<ICustomer>({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  lastNotificationSeen: {
    type: Schema.Types.ObjectId,
    ref: 'RecentActivity',
    default: null
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
  bio: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  customerImage: {
    type: String,
    required: true,
  }
}, {
  timestamps: true
});

export default mongoose.model<ICustomer>('Customer', customerSchema);
