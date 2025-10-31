import Address from './addressModel.js';
import { Types } from 'mongoose';
import mongoose from 'mongoose';

export async function createAddress(customerId: Types.ObjectId | string, addressData: any): Promise<any> {
  const { addressLine, city, zipCode, country, state, isDefault, name } = addressData;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (isDefault) {
      await Address.updateMany(
        { customerId, isDefault: true },
        { isDefault: false }
      ).session(session);
    }

    const address = new Address({
      customerId,
      addressLine,
      city,
      zipCode,
      country,
      state,
      name: name?.trim() || 'Unnamed',
      isDefault: !!isDefault
    });

    await address.save({ session });
    await session.commitTransaction();
    session.endSession();
    
    return address;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

export async function clearDefaultAddresses(customerId: Types.ObjectId | string): Promise<void> {
  await Address.updateMany(
    { customerId, isDefault: true },
    { isDefault: false }
  );
}

export async function getAddressesByCustomer(customerId: Types.ObjectId | string): Promise<any[]> {
  return await Address.find({ customerId }).sort({ isDefault: -1 });
}

export async function updateAddressById(addressId: string, customerId: Types.ObjectId | string, updates: any): Promise<any> {
  return await Address.findOneAndUpdate(
    { _id: addressId, customerId },
    updates,
    { new: true }
  );
}

export async function deleteAddressById(addressId: string, customerId: Types.ObjectId | string): Promise<any> {
  return await Address.findOneAndDelete({
    _id: addressId,
    customerId
  });
}

export async function setAddressAsDefault(addressId: string, customerId: Types.ObjectId | string): Promise<any> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await Address.updateMany(
      { customerId, isDefault: true },
      { isDefault: false }
    ).session(session);

    const address = await Address.findOneAndUpdate(
      { _id: addressId, customerId },
      { isDefault: true },
      { new: true, session }
    );

    await session.commitTransaction();
    session.endSession();
    
    return address;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

export async function findAddressById(addressId: string): Promise<any> {
  return await Address.findById(addressId);
}
