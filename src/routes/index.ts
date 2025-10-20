import express from 'express';

const router = express.Router();

const routes = [
  { path: '/sellers', module: '../modules/Seller/sellerRoutes.js' },
  { path: '/products', module: '../modules/Product/productRoutes.js' },
  { path: '/customers', module: '../modules/Customer/customerRoutes.js' },
  { path: '/carts', module: '../modules/Cart/cartRoutes.js' },
  { path: '/wishlists', module: '../modules/Wishlist/wishlistRoutes.js' },
  { path: '/addresses', module: '../modules/Address/addressRoutes.js' },
  { path: '/orders', module: '../modules/Order/orderRoutes.js' },
  { path: '/auth', module: '../modules/Auth/authRoutes.js' },
  { path: '/payment', module: '../modules/Payment/paymentRoutes.js' },
];

(async () => {
  for (const { path: routePath, module } of routes) {
    const mod = await import(module);
    const r = mod.default || mod.router || mod;
    router.use(routePath, r);
  }
})();

router.get('/ping', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default router;
