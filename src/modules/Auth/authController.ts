import { Response } from 'express';
import jwt from 'jsonwebtoken';
import Seller from '../Seller/sellerModel.js';
import Customer from '../Customer/customerModel.js';
import { AuthRequest } from '../../types/index.js';

export const getUserType = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    if (decoded.sellerId) {
      const seller = await Seller.findById(decoded.sellerId).select("_id");
      if (seller) {
        return res.status(200).json({ userType: "seller", userId: seller._id });
      }
    }

    if (decoded.customerId) {
      const customer = await Customer.findById(decoded.customerId).select("_id");
      if (customer) {
        return res.status(200).json({ userType: "customer", userId: customer._id });
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
    console.error("Unexpected error in getUserType:", error);
    return res.status(500).json({ error: "Server error" });
  }
};
