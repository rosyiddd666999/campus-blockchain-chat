import { Router, Response } from "express";
import { prisma } from "../config/database";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { account } from "../config/blockchain";
import { addToWhitelistOnChain, removeFromWhitelistOnChain, isWhitelisted } from "../services/blockchain";
import { z } from "zod/v4";

const router = Router();

const whitelistSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Format wallet address tidak valid"),
  nim: z.string().min(1, "NIM tidak boleh kosong"),
});

// Helper: check if requesting user is the admin (deployer)
function isAdmin(req: AuthenticatedRequest, res: Response, next: any) {
  if (!account) {
    res.status(500).json({ success: false, error: "Admin account not configured" });
    return;
  }
  
  if (!req.user || req.user.walletAddress.toLowerCase() !== account.address.toLowerCase()) {
    res.status(403).json({ success: false, error: "Akses ditolak. Hanya administrator yang diizinkan." });
    return;
  }
  
  next();
}

// 1. Add to Whitelist on-chain
router.post("/whitelist", authMiddleware, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = whitelistSchema.safeParse(req.body);
    if (!parseResult.success) {
      // ZodError uses `issues` for detailed error items
      const msg = parseResult.error.issues?.[0]?.message || "Invalid input";
      res.status(400).json({ success: false, error: msg });
      return;
    }

    const { walletAddress, nim } = parseResult.data;
    const lowerWallet = walletAddress.toLowerCase();

    // Trigger transaction on-chain
    const txHash = await addToWhitelistOnChain(lowerWallet, nim);
    if (!txHash) {
      res.status(500).json({ success: false, error: "Gagal mendaftarkan whitelist secara on-chain" });
      return;
    }

    // Sync database: set isVerified = true for this user if they are registered
    await prisma.user.updateMany({
      where: { walletAddress: { equals: lowerWallet, mode: "insensitive" } },
      data: { isVerified: true },
    });

    res.json({
      success: true,
      data: {
        walletAddress: lowerWallet,
        nim,
        txHash,
      },
    });
  } catch (error) {
    console.error("Error adding to whitelist:", error);
    res.status(500).json({ success: false, error: "Gagal menambahkan ke whitelist" });
  }
});

// 2. Remove from Whitelist
router.delete("/whitelist/:nim", authMiddleware, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { nim } = req.params;

    // Find student in DB to get wallet address
    const student = await prisma.user.findFirst({
      where: { nim },
    });

    if (!student) {
      res.status(404).json({ success: false, error: "Mahasiswa tidak ditemukan di database" });
      return;
    }

    // Cek status on-chain dulu
    const onChainStatus = await isWhitelisted(student.walletAddress);
    if (!onChainStatus) {
      // Wallet tidak ada di on-chain whitelist, cukup update DB saja
      await prisma.user.update({
        where: { id: student.id },
        data: { isVerified: false },
      });
      res.json({
        success: true,
        data: {
          nim,
          walletAddress: student.walletAddress,
          txHash: null,
          note: "Wallet sudah tidak ada di on-chain whitelist. Hanya database yang diupdate.",
        },
      });
      return;
    }

    // Trigger transaction on-chain
    const txHash = await removeFromWhitelistOnChain(student.walletAddress);
    if (!txHash) {
      res.status(500).json({ success: false, error: "Gagal menghapus whitelist secara on-chain" });
      return;
    }

    // Sync database: set isVerified = false
    await prisma.user.update({
      where: { id: student.id },
      data: { isVerified: false },
    });

    res.json({
      success: true,
      data: {
        nim,
        walletAddress: student.walletAddress,
        txHash,
      },
    });
  } catch (error) {
    console.error("Error removing from whitelist:", error);
    res.status(500).json({ success: false, error: "Gagal menghapus dari whitelist" });
  }
});

// 3. List Registered Students
router.get("/students", authMiddleware, isAdmin, async (_req, res: Response) => {
  try {
    const students = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error("Error listing students:", error);
    res.status(500).json({ success: false, error: "Gagal mengambil daftar mahasiswa" });
  }
});

// 4. Platform Statistics
router.get("/stats", authMiddleware, isAdmin, async (_req, res: Response) => {
  try {
    const [
      totalUsers,
      totalPosts,
      totalAnswers,
      totalComments,
      totalRewardsCount,
      sumRewards,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.answer.count(),
      prisma.comment.count(),
      prisma.rewardHistory.count(),
      prisma.rewardHistory.aggregate({
        _sum: {
          amount: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalPosts,
        totalAnswers,
        totalComments,
        totalRewardsCount,
        totalTokensDistributed: sumRewards._sum.amount || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ success: false, error: "Gagal mengambil statistik platform" });
  }
});

export default router;
