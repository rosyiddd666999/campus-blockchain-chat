import { Router, Request, Response } from "express";
import { generateNonce, SiweMessage } from "siwe";
import jwt from "jsonwebtoken";
import { prisma } from "../config/database";
import { redis } from "../config/redis";
import { isWhitelisted } from "../services/blockchain";
import { account } from "../config/blockchain";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { z } from "zod/v4";

const router = Router();

// Zod schemas for validation
const registerSchema = z.object({
  nim: z.string().min(1, "NIM tidak boleh kosong"),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Format wallet address tidak valid"),
  name: z.string().min(1, "Nama tidak boleh kosong"),
  angkatan: z.number().int().min(2000).max(2100),
});

const verifySchema = z.object({
  message: z.string(),
  signature: z.string(),
});

// 1. GET SIWE Nonce
router.post("/nonce", async (_req: Request, res: Response) => {
  try {
    const nonce = generateNonce();
    // Save nonce in Redis with a 5-minute expiration
    const redisKey = `siwe:nonce:${nonce}`;
    await redis.set(redisKey, "valid", "EX", 300);

    res.json({ success: true, data: { nonce } });
  } catch (error) {
    console.error("Error generating nonce:", error);
    res.status(500).json({ success: false, error: "Gagal membuat nonce" });
  }
});

// 2. Verify SIWE Signature (Login)
router.post("/verify", async (req: Request, res: Response) => {
  try {
    const parseResult = verifySchema.safeParse(req.body);
    if (!parseResult.success) {
      const msg = parseResult.error.issues?.[0]?.message || "Invalid input";
      res.status(400).json({ success: false, error: msg });
      return;
    }

    const { message, signature } = parseResult.data;
    const siweMessage = new SiweMessage(message);
    
    // Verify SIWE signature
    const verifyResult = await siweMessage.verify({ signature });
    if (!verifyResult.success) {
      res.status(400).json({ success: false, error: "Signature tidak valid" });
      return;
    }

    const walletAddress = verifyResult.data.address.toLowerCase();

    // Verify nonce was issued by us and not replayed
    const redisKey = `siwe:nonce:${siweMessage.nonce}`;
    const isValidNonce = await redis.get(redisKey);
    if (!isValidNonce) {
      res.status(400).json({ success: false, error: "Nonce expired atau invalid" });
      return;
    }
    await redis.del(redisKey); // Consume nonce

    // Check if user exists in database
    let user = await prisma.user.findFirst({
      where: { walletAddress: { equals: walletAddress, mode: "insensitive" } },
    });

    if (!user) {
      // Auto-register admin wallet without needing NIM/name
      if (account && walletAddress === account.address.toLowerCase()) {
        user = await prisma.user.create({
          data: {
            walletAddress,
            nim: `ADMIN-${Date.now()}`,
            name: "Administrator",
            angkatan: new Date().getFullYear(),
            isVerified: true,
          },
        });
      } else {
        res.json({
          success: true,
          data: {
            registered: false,
            walletAddress,
          },
        });
        return;
      }
    }

    // Check whitelist status on-chain and sync with database
    const whitelisted = await isWhitelisted(user.walletAddress);
    if (user.isVerified !== whitelisted) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: whitelisted },
      });
    }

    // Generate JWT
    const jwtSecret = (process.env.JWT_SECRET ?? "super-secret-jwt-key-min-32-chars-for-safety-and-compliance") as jwt.Secret;
    const token = jwt.sign(
      {
        id: user.id,
        walletAddress: user.walletAddress,
        nim: user.nim,
      } as Record<string, unknown>,
      jwtSecret,
      { expiresIn: (process.env.JWT_EXPIRES_IN ?? "7d") } as jwt.SignOptions
    );

    res.json({
      success: true,
      data: {
        registered: true,
        token,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          nim: user.nim,
          name: user.name,
          angkatan: user.angkatan,
          isVerified: user.isVerified,
        },
      },
    });
  } catch (error) {
    console.error("Error verifying signature:", error);
    res.status(500).json({ success: false, error: "Gagal memverifikasi signature" });
  }
});

// 3. Register Student
router.post("/register", async (req: Request, res: Response) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const msg = parseResult.error.issues?.[0]?.message || "Invalid input";
      res.status(400).json({ success: false, error: msg });
      return;
    }

    const { nim, walletAddress, name, angkatan } = parseResult.data;
    const lowerWallet = walletAddress.toLowerCase();

    // Check duplicate NIM or wallet in DB
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { nim },
          { walletAddress: { equals: lowerWallet, mode: "insensitive" } },
        ],
      },
    });

    if (existingUser) {
      res.status(409).json({ success: false, error: "NIM atau Wallet Address sudah terdaftar" });
      return;
    }

    // Check if wallet is whitelisted on-chain
    const whitelisted = await isWhitelisted(lowerWallet);

    // Create user in DB
    const user = await prisma.user.create({
      data: {
        nim,
        walletAddress: lowerWallet,
        name,
        angkatan,
        isVerified: whitelisted,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        walletAddress: user.walletAddress,
        nim: user.nim,
        name: user.name,
        angkatan: user.angkatan,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ success: false, error: "Gagal melakukan registrasi" });
  }
});

// 4. Logout
router.delete("/logout", async (_req: Request, res: Response) => {
  res.json({ success: true, message: "Logged out successfully" });
});

// 5. Get Current User Details
router.get("/me", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      res.status(404).json({ success: false, error: "User tidak ditemukan" });
      return;
    }

    // Sync whitelist status
    const whitelisted = await isWhitelisted(user.walletAddress);
    let updatedUser = user;
    if (user.isVerified !== whitelisted) {
      updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: whitelisted },
      });
    }

    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        walletAddress: updatedUser.walletAddress,
        nim: updatedUser.nim,
        name: updatedUser.name,
        angkatan: updatedUser.angkatan,
        isVerified: updatedUser.isVerified,
      },
    });
  } catch (error) {
    console.error("Error fetching me:", error);
    res.status(500).json({ success: false, error: "Gagal mengambil data user" });
  }
});

export default router;