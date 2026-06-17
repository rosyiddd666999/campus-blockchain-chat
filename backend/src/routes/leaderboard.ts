import { Router, Response } from "express";
import { prisma } from "../config/database";

const router = Router();

// 1. All-time Leaderboard (By accumulated rewards in database)
router.get("/", async (_req, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        rewards: true,
      },
    });

    const leaderboard = users
      .map((u) => {
        const totalAmount = u.rewards.reduce((sum, r) => sum + r.amount, 0);
        return {
          id: u.id,
          name: u.name,
          nim: u.nim,
          angkatan: u.angkatan,
          walletAddress: u.walletAddress,
          balance: (BigInt(totalAmount) * 10n ** 18n).toString(),
          balanceFormatted: totalAmount,
        };
      })
      .sort((a, b) => b.balanceFormatted - a.balanceFormatted);

    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ success: false, error: "Gagal mengambil leaderboard" });
  }
});

// 2. Weekly Leaderboard (By rewards in the last 7 days)
router.get("/weekly", async (_req, res: Response) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const users = await prisma.user.findMany({
      include: {
        rewards: {
          where: {
            createdAt: { gte: sevenDaysAgo },
          },
        },
      },
    });

    const weeklyLeaderboard = users
      .map((u) => {
        const weeklyPoints = u.rewards.reduce((sum, r) => sum + r.amount, 0);
        return {
          id: u.id,
          name: u.name,
          nim: u.nim,
          angkatan: u.angkatan,
          walletAddress: u.walletAddress,
          weeklyPoints,
        };
      })
      .sort((a, b) => b.weeklyPoints - a.weeklyPoints);

    res.json({
      success: true,
      data: weeklyLeaderboard,
    });
  } catch (error) {
    console.error("Error fetching weekly leaderboard:", error);
    res.status(500).json({ success: false, error: "Gagal mengambil leaderboard mingguan" });
  }
});

export default router;
