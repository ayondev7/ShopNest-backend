import mongoose, { Schema, Document } from 'mongoose';
import { customAlphabet } from 'nanoid';
const orderIdNanoid = customAlphabet('0123456789', 5);
const txnIdNanoid = customAlphabet('0123456789', 7);

export interface IOrder extends Document {
  orderId: string;
  transactionId: string;
  customerId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  shippingInfoId: mongoose.Types.ObjectId;
  paymentStatus: string;
  orderStatus: string;
  paymentMethod: string;
}

const orderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
    },
    transactionId: {
      type: String,
      unique: true,
      required: true,
    },
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
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingInfoId: {
      type: Schema.Types.ObjectId,
      ref: 'ShippingInfo',
      required: true,
    },
    paymentStatus: {
      type: String,
      required: true,
      default: 'pending',
      enum: ['pending', 'paid', 'failed'],
    },
    orderStatus: {
      type: String,
      required: true,
      default: 'pending', 
      enum: ['pending', 'shipped', 'delivered', 'cancelled'],
    },
    paymentMethod: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    if (!this.orderId) {
      let newOrderId: string | undefined;
      let orderExists = true;

      while (orderExists) {
        newOrderId = `ORD-${orderIdNanoid()}`;
        orderExists = await (this.constructor as any).exists({ orderId: newOrderId });
      }

      this.orderId = newOrderId!;
    }

    if (!this.transactionId) {
      let newTxnId: string | undefined;
      let txnExists = true;

      while (txnExists) {
        newTxnId = `TXN-${txnIdNanoid()}`;
        txnExists = await (this.constructor as any).exists({ transactionId: newTxnId });
      }

      this.transactionId = newTxnId!;
    }
  }

  next();
});

export default mongoose.model<IOrder>('Order', orderSchema);
