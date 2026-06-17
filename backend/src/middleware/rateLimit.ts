import { Request, Response, NextFunction } from "express";
import { redis } from "../config/redis";
import { AuthenticatedRequest } from "./auth";

export async function rateLimitMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const identifier = req.user?.id || req.ip || "anonymous";
  const key = `ratelimit:${identifier}`;

  try {
    const requests = await redis.incr(key);
    if (requests === 1) {
      await redis.expire(key, 60); // 1 minute window
    }

    if (requests > 60) { // Limit to 60 requests per minute
      res.status(429).json({
        success: false,
        error: "Terlalu banyak request. Silakan coba beberapa saat lagi.",
      });
      return;
    }
    
    next();
  } catch (error) {
    console.error("Rate limiter Redis error:", error);
    next(); // Fallback: allow request if Redis has issues
  }
}
