import Cart from './cartModel.js';
import CartItem from './cartItemModel.js';
import Product from '../Product/productModel.js';
import Wishlist from '../Wishlist/wishlistModel.js';
import { Types } from 'mongoose';

export async function findCartByCustomerAndTitle(customerId: Types.ObjectId | string, title: string): Promise<any> {
  return await Cart.findOne({ customerId, title });
}

export async function createCart(customerId: Types.ObjectId | string, title: string, productIds: any[] = []): Promise<any> {
  return new Cart({ customerId, title, productIds });
}

export async function getCartsByCustomer(customerId: Types.ObjectId | string): Promise<any[]> {
  return await Cart.find({ customerId }).populate({
    path: 'productIds',
    select: 'title price quantity colour model productImages',
  });
}

export async function addProductToCart(customerId: Types.ObjectId | string, productId: string): Promise<any> {
  const product = await Product.findById(productId).select('category');
  if (!product) {
    return { success: false, error: 'Product not found' };
  }

  const title = product.category || '';
  let cart = await findCartByCustomerAndTitle(customerId, title);
  
  if (!cart) {
    cart = await createCart(customerId, title);
  }

  if (cart.productIds.map(String).includes(String(productId))) {
    return { success: false, message: 'Product already in cart' };
  }

  cart.productIds.push(productId);
  await cart.save();

  return { success: true, cartId: cart._id };
}

export async function processWishlistToCart(customerId: Types.ObjectId | string, wishlist: any, productIds: string[]): Promise<any> {
  const title = wishlist.title;
  let cart = await findCartByCustomerAndTitle(customerId, title);
  
  if (!cart) {
    cart = await createCart(customerId, title);
  }

  const added = [];
  const skipped = [];
  const productsToRemove = [];

  for (const pid of productIds) {
    if (cart.productIds.includes(pid)) {
      skipped.push({ title, productId: pid, reason: 'Already in cart' });
    } else {
      cart.productIds.push(pid);
      added.push({ title, productId: pid });
      productsToRemove.push(pid);
    }
  }

  await cart.save();
  return { added, skipped, productsToRemove };
}

export async function removeProductsFromWishlist(wishlistId: string, productIds: string[]): Promise<any> {
  const wishlist = await Wishlist.findById(wishlistId);
  if (!wishlist) return { deleted: false, updated: false };

  wishlist.productIds = wishlist.productIds.filter(
    (id: any) => !productIds.includes(id.toString())
  );

  if (wishlist.productIds.length === 0) {
    await Wishlist.findByIdAndDelete(wishlistId);
    return { deleted: true, updated: false };
  } else {
    await wishlist.save();
    return { deleted: false, updated: true };
  }
}

export function formatCartProducts(carts: any[]): any {
  const grouped: any = {};
  let totalProductsCount = 0;

  for (const cart of carts) {
    const title = cart.title && cart.title.trim() ? cart.title.trim() : null;
    const groupKey = title || `cart_${cart._id.toString()}`;

    if (!grouped[groupKey]) {
      grouped[groupKey] = {
        title: title || '',
        _id: cart._id,
        products: [],
      };
    }

    const products = cart.productIds.map((product: any) => ({
      _id: product._id,
      title: product.title,
      price: product.price,
      stock: product.quantity,
      colour: product.colour,
      model: product.model,
      image: product.productImages?.length > 0 ? product.productImages[0] : null,
    }));

    grouped[groupKey].products.push(...products);
    totalProductsCount += products.length;
  }

  return {
    lists: Object.values(grouped),
    productsCount: totalProductsCount,
  };
}

export async function removeProductsFromCarts(customerId: Types.ObjectId | string, cartIds: string[], productIds: string[]): Promise<any> {
  const carts = await Cart.find({ 
    _id: { $in: cartIds }, 
    customerId 
  });

  if (!carts || carts.length === 0) {
    return { cartsProcessed: 0, cartsModified: 0, cartsDeleted: 0 };
  }

  let cartsModified = 0;
  let cartsDeleted = 0;

  for (const cart of carts) {
    const initialLength = cart.productIds.length;
    
    cart.productIds = cart.productIds.filter(
      (p: any) => !productIds.includes(p.toString())
    );

    if (cart.productIds.length !== initialLength) {
      cartsModified++;
    }

    if (cart.productIds.length === 0) {
      await Cart.deleteOne({ _id: cart._id });
      cartsDeleted++;
      cartsModified--;
    } else {
      await cart.save();
    }
  }

  return {
    cartsProcessed: carts.length,
    cartsModified,
    cartsDeleted
  };
}

export async function updateCartItemQuantity(customerId: Types.ObjectId | string, productId: string, quantity: number): Promise<any> {
  let cartItem = await CartItem.findOne({ 
    customerId, 
    productId 
  });

  if (!cartItem) {
    cartItem = new CartItem({
      customerId,
      productId,
      quantity
    });
  } else {
    cartItem.quantity = quantity;
  }

  await cartItem.save();
  return cartItem;
}

export async function removeOrderedProductsFromCart(customerId: Types.ObjectId | string, orderedProductIds: string[], session: any): Promise<void> {
  const carts = await Cart.find({ customerId }).session(session);

  for (const cart of carts) {
    const productIdsArray = Array.isArray(cart.productIds)
      ? cart.productIds.map((id: any) => id.toString())
      : [(cart.productIds as any).toString()];

    const remaining = productIdsArray.filter(
      (id: string) => !orderedProductIds.includes(id)
    );

    if (remaining.length === 0) {
      await Cart.deleteOne({ _id: cart._id }).session(session);
    } else {
      cart.productIds = remaining;
      await cart.save({ session });
    }
  }
}
