import { Router, Request, Response } from "express";
import { prisma } from "../config/database";
import { getOnChainBalance, getUnclaimedBalance } from "../services/blockchain";
import { formatEther } from "viem";

const router = Router();

router.get("/:address", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const lowerAddress = address.toLowerCase();

    const user = await prisma.user.findFirst({
      where: { walletAddress: { equals: lowerAddress, mode: "insensitive" } },
      include: {
        posts: {
          orderBy: { createdAt: "desc" },
          include: {
            author: {
              select: { id: true, name: true, walletAddress: true },
            },
            _count: {
              select: { answers: true, comments: true, likes: true },
            },
          },
        },
        answers: {
          orderBy: { createdAt: "desc" },
          include: {
            post: { select: { id: true, title: true } },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const [onChainBig, unclaimedBig] = await Promise.all([
      getOnChainBalance(lowerAddress),
      getUnclaimedBalance(lowerAddress),
    ]);

    const onChain = parseFloat(formatEther(onChainBig));
    const unclaimed = parseFloat(formatEther(unclaimedBig));

    const formattedPosts = user.posts.map((p) => ({
      id: p.id,
      title: p.title,
      body: p.body,
      tags: p.tags,
      author: p.author,
      txHash: p.txHash,
      bestAnswerId: p.bestAnswer,
      answersCount: p._count.answers,
      commentsCount: p._count.comments,
      likesCount: p._count.likes,
      createdAt: p.createdAt,
    }));

    const formattedAnswers = user.answers.map((a) => ({
      id: a.id,
      body: a.body,
      txHash: a.txHash,
      isBest: a.isBest,
      createdAt: a.createdAt,
      postId: a.post.id,
      postTitle: a.post.title,
    }));

    res.json({
      success: true,
      data: {
        id: user.id,
        walletAddress: user.walletAddress,
        nim: user.nim,
        name: user.name,
        angkatan: user.angkatan,
        isVerified: user.isVerified,
        balance: onChain + unclaimed,
        onChainBalance: onChain,
        unclaimedBalance: unclaimed,
        posts: formattedPosts,
        answers: formattedAnswers,
      },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ success: false, error: "Gagal mengambil data profil" });
  }
});

export default router;
