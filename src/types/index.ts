import { Request } from 'express';
import { Document, Types } from 'mongoose';

export interface ICustomer extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  lastNotificationSeen: Types.ObjectId | null;
  email: string;
  phone?: string;
  bio?: string;
  password: string;
  customerImage: string;
  createdAt: Date;
  updatedAt: Date;
  toObject(): any;
}

export interface ISeller extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  password: string;
  lastNotificationSeen: Types.ObjectId | null;
  sellerImage: string;
  createdAt: Date;
  updatedAt: Date;
  toObject(): any;
}

export interface AuthRequest extends Request {
  seller?: ISeller;
  customer?: ICustomer;
  file?: any;
  files?: any;
}
