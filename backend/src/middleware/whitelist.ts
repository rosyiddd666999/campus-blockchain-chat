import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";
import { isWhitelisted } from "../services/blockchain";

export async function whitelistMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user || !req.user.walletAddress) {
    res.status(401).json({ success: false, error: "Unauthorized. Wallet address not found." });
    return;
  }

  try {
    const whitelisted = await isWhitelisted(req.user.walletAddress);
    if (!whitelisted) {
      res.status(403).json({
        success: false,
        error: "Akses ditolak. Wallet address Anda belum terdaftar di whitelist Informatika.",
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error("Error in whitelist middleware:", error);
    res.status(500).json({ success: false, error: "Gagal memverifikasi status whitelist." });
  }
}
