import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { AuthRequest, ICustomer, ISeller } from '../types/index.js';
import Seller from '../modules/Seller/sellerModel.js';
import Customer from '../modules/Customer/customerModel.js';

const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    if (decoded.sellerId) {
      const seller = await Seller.findById(decoded.sellerId).select("-password") as ISeller | null;
      if (seller) {
        req.seller = seller;
        return next();
      }
    }

    if (decoded.customerId) {
      const customer = await Customer.findById(decoded.customerId).select("-password") as ICustomer | null;
      if (customer) {
        req.customer = customer;
        return next();
      }
    }

    return res.status(401).json({ error: "Invalid token: user not found" });
  } catch (error: any) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    res.status(500).json({ error: "Server error" });
  }
};

export default auth;
