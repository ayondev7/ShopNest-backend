import Address from './addressModel.js';
import { Types } from 'mongoose';

export async function createAddress(customerId: Types.ObjectId | string, addressData: any): Promise<any> {
  const { addressLine, city, zipCode, country, state, isDefault, name } = addressData;

  if (isDefault) {
    await clearDefaultAddresses(customerId);
  }

  return await Address.create({
    customerId,
    addressLine,
    city,
    zipCode,
    country,
    state,
    name: name?.trim() || 'Unnamed',
    isDefault: !!isDefault
  });
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
  await clearDefaultAddresses(customerId);

  return await Address.findOneAndUpdate(
    { _id: addressId, customerId },
    { isDefault: true },
    { new: true }
  );
}

export async function findAddressById(addressId: string): Promise<any> {
  return await Address.findById(addressId);
}
