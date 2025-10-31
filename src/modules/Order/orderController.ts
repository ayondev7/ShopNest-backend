import { Request, Response } from 'express';
import * as orderService from './orderService';
import Address from '../Address/addressModel';
import mongoose from 'mongoose';
import { TempOrder } from './tempOrderModel';
import Cart from '../Cart/cartModel';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { BadRequestError, NotFoundError, AuthenticationError, AuthorizationError } from '../../utils/errorClasses.js';

export const AddOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      paymentMethod,
      promoCode,
      fullName,
      phoneNumber,
      email,
      addressId,
      addressLine1,
      addressLine2,
      city,
      state,
      zipCode,
      country,
      name,
      checkoutPayload,
    } = req.body;

    const customerId = (req as any).customer?._id;

    if (!customerId) {
      await session.abortTransaction();
      session.endSession();
      throw new BadRequestError('Customer ID is required');
    }

    if (!checkoutPayload || !checkoutPayload.products || checkoutPayload.products.length === 0) {
      await session.abortTransaction();
      session.endSession();
      throw new BadRequestError('Products are required in checkout payload');
    }

    let shippingInfoId;
    let primaryAddressId = addressId;
    let optionalAddressId = null;
    let addressForGateway: any;

    if (!addressId) {
      if (!addressLine1 || !city || !zipCode || !country) {
        await session.abortTransaction();
        session.endSession();
        throw new BadRequestError('Address details are required when addressId is not provided');
      }

      const primaryAddress = new Address({
        customerId,
        name: name || 'Unnamed',
        addressLine: addressLine1,
        city,
        zipCode,
        country,
        state: state || '',
        isDefault: false,
      });

      const savedPrimaryAddress = await primaryAddress.save({ session });
      primaryAddressId = savedPrimaryAddress._id;

      addressForGateway = {
        addressLine: savedPrimaryAddress.addressLine,
        city: savedPrimaryAddress.city,
        zipCode: savedPrimaryAddress.zipCode,
        country: savedPrimaryAddress.country,
        state: savedPrimaryAddress.state,
      };

      if (addressLine2 && addressLine2.trim() !== '') {
        const optionalAddress = new Address({
          customerId,
          name: name || 'Unnamed',
          addressLine: addressLine2,
          city,
          zipCode,
          country,
          state: state || '',
          isDefault: false,
        });

        const savedOptionalAddress = await optionalAddress.save({ session });
        optionalAddressId = savedOptionalAddress._id;
      }
    } else {
      const foundAddress = await Address.findById(addressId).session(session);
      if (!foundAddress) {
        await session.abortTransaction();
        session.endSession();
        throw new NotFoundError('Address not found');
      }
      addressForGateway = {
        addressLine: foundAddress.addressLine,
        city: foundAddress.city,
        zipCode: foundAddress.zipCode,
        country: foundAddress.country,
        state: foundAddress.state,
      };
    }

    const shippingData = { fullName, phoneNumber, email, addressId: primaryAddressId, optionalAddressId };
    const savedShippingInfo = await orderService.createShippingInfo(customerId, shippingData, session);
    shippingInfoId = savedShippingInfo._id;

    const createdOrders = [];
    const products = checkoutPayload.products;

    for (const product of products) {
      const { productId, quantity, price } = product;

      if (!productId || !quantity || price === undefined) {
        await session.abortTransaction();
        session.endSession();
        throw new BadRequestError('Each product must have productId, quantity, and price');
      }

      const quantityNum = parseInt(quantity);
      const orderData = {
        customerId,
        productId,
        quantity: quantityNum,
        price,
        paymentMethod,
        shippingInfoId,
      };

      const savedOrder = await orderService.createOrder(orderData, session);
      createdOrders.push(savedOrder);

      await orderService.createSellerNotificationForOrder(productId, savedOrder._id, session);
      await orderService.createOrderActivity(customerId, savedOrder._id, savedOrder.orderId, session);
    }

    if (paymentMethod === 'cod') {
      const orderedProductIds = products.map((p: any) => p.productId);
      const carts = await Cart.find({ customerId }).session(session);

      for (const cart of carts) {
        const productIdsArray = Array.isArray(cart.productIds) ? cart.productIds.map((id: any) => id.toString()) : [(cart.productIds as any).toString()];
        const remaining = productIdsArray.filter((id: string) => !orderedProductIds.includes(id));

        if (remaining.length === 0) {
          await Cart.deleteOne({ _id: cart._id }).session(session);
        } else {
          cart.productIds = remaining;
          await cart.save({ session });
        }
      }

      await session.commitTransaction();
      session.endSession();

      res.status(201).json({
        success: true,
        message: 'Orders created successfully',
        data: {
          orders: createdOrders,
          shippingInfo: savedShippingInfo,
          addresses: { primary: primaryAddressId, optional: optionalAddressId },
          orderSummary: {
            totalOrders: createdOrders.length,
            subtotal: checkoutPayload.subtotal,
            shipping: checkoutPayload.shipping || 0,
            tax: checkoutPayload.tax || 0,
            total: checkoutPayload.total,
          },
        },
      });
      return;
    } else if (paymentMethod === 'gateway') {
      const tempOrderData = {
        customerId,
        orders: createdOrders.map((order: any) => order._id),
        shippingInfoId,
        addressIds: { primary: primaryAddressId, optional: optionalAddressId },
        checkoutPayload,
        products,
      };

      const tempOrder = new TempOrder(tempOrderData);
      const savedTempOrder = await tempOrder.save({ session });

      const addressData = { ...addressForGateway, addressLine2 };
      const paymentData = orderService.buildPaymentData(checkoutPayload, savedTempOrder._id, shippingData, addressData);

      await session.commitTransaction();
      session.endSession();

      const apiResponse = await orderService.initializePaymentGateway(paymentData);

      if (apiResponse.GatewayPageURL) {
        res.status(200).json({
          success: true,
          message: 'Payment session created',
          data: { paymentUrl: apiResponse.GatewayPageURL, sessionkey: apiResponse.sessionkey },
        });
      } else {
        res.status(400).json({ success: false, message: 'Failed to create payment session', error: apiResponse });
      }
      return;
    }
  } catch (error: any) {
    try {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
    } catch (abortErr) {}
    session.endSession();
    throw error;
  }
});

export const paymentSuccess = async (req: Request, res: Response): Promise<void> => {
  const { tran_id } = req.query;
  try {
    if (!tran_id || !String(tran_id).startsWith('temp_')) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/fail?tran_id=invalid`);
    }

    const tempOrderId = String(tran_id).replace('temp_', '');
    const tempOrder = await TempOrder.findById(tempOrderId).populate('orders').populate('shippingInfoId');

    if (!tempOrder) {
      return res.redirect(`${process.env.FRONTEND_URL}/payment/fail?tran_id=${tran_id}`);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await orderService.updateOrdersPaymentStatus(tempOrder.orders, 'paid', session);

      const populatedOrders = await orderService.getOrdersByIds(tempOrder.orders, session);

      for (const order of populatedOrders) {
        await orderService.createSellerNotificationForPayment(order.productId, order._id, order.orderId, session);
      }

      const orderedProductIds = tempOrder.products.map((p: any) => p.productId);
      const carts = await Cart.find({ customerId: tempOrder.customerId }).session(session);

      for (const cart of carts) {
        const productIdsArray = Array.isArray(cart.productIds) ? cart.productIds.map((id: any) => id.toString()) : [(cart.productIds as any).toString()];
        const remaining = productIdsArray.filter((id: string) => !orderedProductIds.includes(id));

        if (remaining.length === 0) {
          await Cart.deleteOne({ _id: cart._id }).session(session);
        } else {
          cart.productIds = remaining;
          await cart.save({ session });
        }
      }

      await TempOrder.findByIdAndDelete(tempOrderId).session(session);
      await session.commitTransaction();
      session.endSession();

      return res.redirect(`${process.env.FRONTEND_URL}/payment/success?tran_id=${tran_id}`);
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      return res.redirect(`${process.env.FRONTEND_URL}/payment/fail?tran_id=${tran_id}`);
    }
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/payment/fail?tran_id=${tran_id}`);
  }
};

export const paymentFail = async (req: Request, res: Response): Promise<void> => {
  const { tran_id } = req.query;

  try {
    if (tran_id && String(tran_id).startsWith('temp_')) {
      const tempOrderId = String(tran_id).replace('temp_', '');
      const tempOrder = await TempOrder.findById(tempOrderId).populate('orders');

      if (tempOrder) {
        await orderService.rollbackFailedOrder(tempOrder);
      }
    }

    res.redirect(`${process.env.FRONTEND_URL}/payment/fail?tran_id=${tran_id || 'unknown'}`);
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to process payment failure', error: error.message });
  }
};

export const paymentCancel = async (req: Request, res: Response): Promise<void> => {
  await paymentFail(req, res);
};

export const getAllOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const customer = (req as any).customer;

  if (!customer || !customer._id) {
    throw new BadRequestError('Customer information not found');
  }

  const orders = await orderService.getOrdersByCustomer(customer._id);

  res.status(200).json({ success: true, count: orders.length, orders });
});

export const getSellerOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const seller = (req as any).seller;

  if (!seller || !seller._id) {
    throw new BadRequestError('Seller information not found');
  }

  const orders = await orderService.getOrdersBySeller(seller._id);

  res.status(200).json({ success: true, count: orders.length, data: orders });
});

export const getOrderById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const sellerId = (req as any).seller._id;

  const order = await orderService.getOrderById(id, sellerId);

  if (!order) {
    throw new NotFoundError('Order not found or unauthorized');
  }

  res.json(order);
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { orderId } = req.params;
  const { orderStatus } = req.body;

  const sellerId = (req as any).seller?._id;
  const customerId = (req as any).customer?._id;

  if (!orderId || !orderStatus) {
    throw new BadRequestError('Order ID and orderStatus are required.');
  }

  const result = await orderService.updateOrderStatus(orderId, orderStatus, customerId, sellerId);

  if (!result) {
    throw new NotFoundError('Order not found.');
  }

  if ('authorized' in result && !result.authorized) {
    throw new AuthorizationError('You are not authorized to update this order.');
  }

  if ('buyAgain' in result && result.buyAgain) {
    res.status(201).json({ message: 'New order created successfully for Buy Again.', newOrder: result.newOrder });
    return;
  }

  res.status(200).json({ message: 'Order status updated successfully.', order: result.order });
});

export const getOrderStatusCounts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const seller = (req as any).seller;
  const { _id: sellerId } = seller;

  const counts = await orderService.getOrderStatusCounts(sellerId);

  res.status(200).json(counts);
});

export const getAllPayments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const customer = (req as any).customer;
  const customerId = customer?._id;

  if (!customerId) {
    throw new BadRequestError('Customer ID is required');
  }

  const payments = await orderService.getPaymentsByCustomer(customerId);

  res.status(200).json({ success: true, payments });
});
