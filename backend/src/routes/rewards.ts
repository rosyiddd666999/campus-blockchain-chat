import { Router, Response } from "express";
import { prisma } from "../config/database";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { formatEther } from "viem";
import {
  getOnChainBalance,
  getUnclaimedBalance,
  getDailyStatsOnChain,
} from "../services/blockchain";

const router = Router();

// 1. Fetch CSIT Balances (Claimed On-Chain & Unclaimed)
router.get("/balance", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const [onChainBig, unclaimedBig] = await Promise.all([
      getOnChainBalance(req.user.walletAddress),
      getUnclaimedBalance(req.user.walletAddress),
    ]);

    const onChainFormatted = parseFloat(formatEther(onChainBig));
    const unclaimedFormatted = parseFloat(formatEther(unclaimedBig));

    res.json({
      success: true,
      data: {
        onChain: onChainBig.toString(),
        unclaimed: unclaimedBig.toString(),
        onChainFormatted,
        unclaimedFormatted,
      },
    });
  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).json({ success: false, error: "Gagal mengambil saldo token" });
  }
});

// 2. Reward History Logs (From DB)
router.get("/history", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const history = await prisma.rewardHistory.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error fetching reward history:", error);
    res.status(500).json({ success: false, error: "Gagal mengambil riwayat reward" });
  }
});

// 3. Daily Action Statistics (From Blockchain/DB)
router.get("/daily-stats", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    // Get current Unix timestamp (seconds)
    const currentTimestamp = Math.floor(Date.now() / 1000);

    const stats = await getDailyStatsOnChain(req.user.walletAddress, currentTimestamp);

    if (!stats) {
      res.json({
        success: true,
        data: {
          postQuestionCount: 0,
          postAnswerCount: 0,
          receiveLikeCount: 0,
          postCommentCount: 0,
          sharePostCount: 0,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        postQuestionCount: Number(stats.postQuestionCount),
        postAnswerCount: Number(stats.postAnswerCount),
        receiveLikeCount: Number(stats.receiveLikeCount),
        postCommentCount: Number(stats.postCommentCount),
        sharePostCount: Number(stats.sharePostCount),
      },
    });
  } catch (error) {
    console.error("Error fetching daily stats:", error);
    res.status(500).json({ success: false, error: "Gagal mengambil statistik harian" });
  }
});

export default router;
