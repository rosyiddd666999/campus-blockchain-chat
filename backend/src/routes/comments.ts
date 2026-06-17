import { Router, Response } from "express";
import { prisma } from "../config/database";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { whitelistMiddleware } from "../middleware/whitelist";
import { distributeReward } from "../services/reward";
import { z } from "zod/v4";

const router = Router();

const createCommentSchema = z.object({
  body: z.string().min(1, "Komentar tidak boleh kosong"),
  postId: z.string().optional(),
  answerId: z.string().optional(),
});

// 1. Create Comment (+1 CSIT reward)
router.post("/", authMiddleware, whitelistMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const parseResult = createCommentSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
      return;
    }

    const { body, postId, answerId } = parseResult.data;

    if (!postId && !answerId) {
      res.status(400).json({ success: false, error: "Harus menyertakan postId atau answerId" });
      return;
    }

    // Verify parent exists
    if (postId) {
      const postExists = await prisma.post.findUnique({ where: { id: postId } });
      if (!postExists) {
        res.status(404).json({ success: false, error: "Pertanyaan tidak ditemukan" });
        return;
      }
    } else if (answerId) {
      const answerExists = await prisma.answer.findUnique({ where: { id: answerId } });
      if (!answerExists) {
        res.status(404).json({ success: false, error: "Jawaban tidak ditemukan" });
        return;
      }
    }

    // Save to DB
    const comment = await prisma.comment.create({
      data: {
        body,
        postId: postId || null,
        answerId: answerId || null,
        authorId: req.user.id,
      },
    });

    // Trigger on-chain reward (PostComment)
    const rewardResult = await distributeReward(req.user.id, "PostComment", comment.id);

    res.status(201).json({
      success: true,
      data: {
        id: comment.id,
        body: comment.body,
        postId: comment.postId,
        answerId: comment.answerId,
        authorId: comment.authorId,
        createdAt: comment.createdAt,
        rewardTxHash: rewardResult.txHash || null,
      },
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ success: false, error: "Gagal membuat komentar" });
  }
});

// 2. Delete Comment
router.delete("/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const { id } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      res.status(404).json({ success: false, error: "Komentar tidak ditemukan" });
      return;
    }

    // Verify author
    if (comment.authorId !== req.user.id) {
      res.status(403).json({ success: false, error: "Hanya pemilik komentar yang dapat menghapusnya" });
      return;
    }

    await prisma.comment.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Komentar berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ success: false, error: "Gagal menghapus komentar" });
  }
});

// 3. Toggle Like Comment (Simulation since Like table has no commentId as per Schema)
router.post("/:id/like", authMiddleware, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    // Return mock successful toggle since the schema constraints do not store comment likes
    res.json({
      success: true,
      data: {
        liked: true,
        likesCount: 1,
      },
    });
  } catch (error) {
    console.error("Error liking comment:", error);
    res.status(500).json({ success: false, error: "Gagal menyukai komentar" });
  }
});

export default router;