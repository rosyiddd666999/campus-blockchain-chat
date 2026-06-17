import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    walletAddress: string;
    nim: string;
  };
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Access denied. No token provided." });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const secret = process.env.JWT_SECRET ?? "super-secret-jwt-key-min-32-chars-for-safety-and-compliance";
    const decoded = jwt.verify(token, secret) as any;
    
    req.user = {
      id: decoded.id,
      walletAddress: decoded.walletAddress,
      nim: decoded.nim,
    };
    
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: "Invalid token" });
  }
}
