import { Router, Request, Response } from "express";
import { prisma } from "../config/database";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import { whitelistMiddleware } from "../middleware/whitelist";
import { distributeReward } from "../services/reward";
import { z } from "zod/v4";

const router = Router();

// Zod schemas for request validation
const createPostSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter"),
  body: z.string().min(10, "Deskripsi minimal 10 karakter"),
  tags: z.array(z.string()).max(5, "Maksimal 5 tag"),
});

const createAnswerSchema = z.object({
  body: z.string().min(5, "Jawaban minimal 5 karakter"),
});

const bestAnswerSchema = z.object({
  answerId: z.string(),
});

// 1. List Posts (Paginated with search and tag filters)
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.max(1, Number(req.query.limit || 10));
    const search = req.query.search as string;
    const tag = req.query.tag as string;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (tag) {
      where.tags = { has: tag };
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { body: { contains: search, mode: "insensitive" } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              walletAddress: true,
            },
          },
          _count: {
            select: {
              answers: true,
              comments: true,
              likes: true,
            },
          },
        },
      }),
      prisma.post.count({ where }),
    ]);

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      body: post.body,
      tags: post.tags,
      author: post.author,
      bestAnswer: post.bestAnswer,
      answersCount: post._count.answers,
      commentsCount: post._count.comments,
      likesCount: post._count.likes,
      createdAt: post.createdAt,
    }));

    res.json({
      success: true,
      data: {
        posts: formattedPosts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ success: false, error: "Gagal mengambil daftar postingan" });
  }
});

// 2. Create Question (+5 CSIT reward)
router.post("/", authMiddleware, whitelistMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const parseResult = createPostSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
      return;
    }

    const { title, body, tags } = parseResult.data;

    // Create post in DB
    const post = await prisma.post.create({
      data: {
        title,
        body,
        tags,
        authorId: req.user.id,
      },
    });

    // Trigger on-chain reward & database log
    const rewardResult = await distributeReward(req.user.id, "PostQuestion", post.id);

    // Update post with transaction hash if successful
    let updatedPost = post;
    if (rewardResult.success && rewardResult.txHash) {
      updatedPost = await prisma.post.update({
        where: { id: post.id },
        data: { txHash: rewardResult.txHash },
      });
    }

    res.status(201).json({
      success: true,
      data: {
        id: updatedPost.id,
        title: updatedPost.title,
        body: updatedPost.body,
        tags: updatedPost.tags,
        authorId: updatedPost.authorId,
        txHash: updatedPost.txHash,
        rewardTxHash: rewardResult.txHash || null,
      },
    });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ success: false, error: "Gagal memposting pertanyaan" });
  }
});

// 3. Get Post Details
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        answers: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                walletAddress: true,
              },
            },
            comments: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: { createdAt: "asc" },
            },
            _count: {
              select: {
                likes: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    if (!post) {
      res.status(404).json({ success: false, error: "Pertanyaan tidak ditemukan" });
      return;
    }

    const formattedPost = {
      id: post.id,
      title: post.title,
      body: post.body,
      tags: post.tags,
      author: post.author,
      txHash: post.txHash,
      createdAt: post.createdAt,
      likesCount: post._count.likes,
      bestAnswer: post.bestAnswer,
      comments: post.comments.map((c) => ({
        id: c.id,
        body: c.body,
        author: c.author,
        createdAt: c.createdAt,
      })),
      answers: post.answers.map((a) => ({
        id: a.id,
        body: a.body,
        author: a.author,
        isBest: a.isBest,
        txHash: a.txHash,
        createdAt: a.createdAt,
        likesCount: a._count.likes,
        comments: a.comments.map((ac) => ({
          id: ac.id,
          body: ac.body,
          author: ac.author,
          createdAt: ac.createdAt,
        })),
      })),
    };

    res.json({
      success: true,
      data: formattedPost,
    });
  } catch (error) {
    console.error("Error fetching post details:", error);
    res.status(500).json({ success: false, error: "Gagal mengambil detail postingan" });
  }
});

// 4. Answer Question (+10 CSIT reward)
router.post("/:id/answers", authMiddleware, whitelistMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const { id: postId } = req.params;

    const postExists = await prisma.post.findUnique({ where: { id: postId } });
    if (!postExists) {
      res.status(404).json({ success: false, error: "Pertanyaan tidak ditemukan" });
      return;
    }

    const parseResult = createAnswerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
      return;
    }

    const { body } = parseResult.data;

    // Create answer in DB
    const answer = await prisma.answer.create({
      data: {
        body,
        postId,
        authorId: req.user.id,
      },
    });

    // Trigger reward & database log
    const rewardResult = await distributeReward(req.user.id, "PostAnswer", answer.id);

    // Update answer with transaction hash if successful
    let updatedAnswer = answer;
    if (rewardResult.success && rewardResult.txHash) {
      updatedAnswer = await prisma.answer.update({
        where: { id: answer.id },
        data: { txHash: rewardResult.txHash },
      });
    }

    res.status(201).json({
      success: true,
      data: {
        id: updatedAnswer.id,
        body: updatedAnswer.body,
        postId: updatedAnswer.postId,
        authorId: updatedAnswer.authorId,
        txHash: updatedAnswer.txHash,
        rewardTxHash: rewardResult.txHash || null,
      },
    });
  } catch (error) {
    console.error("Error creating answer:", error);
    res.status(500).json({ success: false, error: "Gagal memposting jawaban" });
  }
});

// 5. Pick Best Answer (+20 CSIT reward to author of answer)
router.post("/:id/best", authMiddleware, whitelistMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const { id: postId } = req.params;

    const parseResult = bestAnswerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ success: false, error: parseResult.error.errors[0].message });
      return;
    }

    const { answerId } = parseResult.data;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      res.status(404).json({ success: false, error: "Pertanyaan tidak ditemukan" });
      return;
    }

    // Check if the current user is indeed the author of the post
    if (post.authorId !== req.user.id) {
      res.status(403).json({ success: false, error: "Hanya penulis pertanyaan yang dapat memilih jawaban terbaik" });
      return;
    }

    // Check if the post already has a best answer selected
    if (post.bestAnswer) {
      res.status(400).json({ success: false, error: "Jawaban terbaik sudah dipilih sebelumnya" });
      return;
    }

    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
    });

    if (!answer || answer.postId !== postId) {
      res.status(404).json({ success: false, error: "Jawaban tidak ditemukan pada pertanyaan ini" });
      return;
    }

    // Set best answer in DB
    await prisma.$transaction([
      prisma.post.update({
        where: { id: postId },
        data: { bestAnswer: answerId },
      }),
      prisma.answer.update({
        where: { id: answerId },
        data: { isBest: true },
      }),
    ]);

    // Distribute reward to answer author
    const rewardResult = await distributeReward(answer.authorId, "BestAnswerSelected", answer.id);

    res.json({
      success: true,
      message: "Berhasil memilih jawaban terbaik",
      data: {
        rewardTxHash: rewardResult.txHash || null,
      },
    });
  } catch (error) {
    console.error("Error setting best answer:", error);
    res.status(500).json({ success: false, error: "Gagal memilih jawaban terbaik" });
  }
});

// 6. Toggle Like Post (+2 CSIT reward to author of post)
router.post("/:id/like", authMiddleware, whitelistMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const { id: postId } = req.params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      res.status(404).json({ success: false, error: "Pertanyaan tidak ditemukan" });
      return;
    }

    // Check if like already exists
    const existingLike = await prisma.like.findFirst({
      where: {
        userId: req.user.id,
        postId,
      },
    });

    if (existingLike) {
      // Unlike: remove from DB
      await prisma.like.delete({
        where: { id: existingLike.id },
      });
      res.json({
        success: true,
        data: { liked: false },
      });
    } else {
      // Like: create in DB
      await prisma.like.create({
        data: {
          userId: req.user.id,
          postId,
        },
      });

      // Distribute reward to post author (ReceiveLike)
      let rewardTxHash = null;
      if (post.authorId !== req.user.id) { // Prevent self-rewarding for liking own post
        const rewardResult = await distributeReward(post.authorId, "ReceiveLike", post.id);
        rewardTxHash = rewardResult.txHash || null;
      }

      res.json({
        success: true,
        data: { liked: true, rewardTxHash },
      });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ success: false, error: "Gagal menyukai postingan" });
  }
});

// 7. Share Post (+1 CSIT reward to author of post)
router.post("/:id/share", authMiddleware, whitelistMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const { id: postId } = req.params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      res.status(404).json({ success: false, error: "Pertanyaan tidak ditemukan" });
      return;
    }

    // Distribute reward to post author (SharePost)
    let rewardTxHash = null;
    if (post.authorId !== req.user.id) {
      const rewardResult = await distributeReward(post.authorId, "SharePost", post.id);
      rewardTxHash = rewardResult.txHash || null;
    }

    res.json({
      success: true,
      message: "Post shared successfully",
      data: { rewardTxHash },
    });
  } catch (error) {
    console.error("Error sharing post:", error);
    res.status(500).json({ success: false, error: "Gagal membagikan postingan" });
  }
});

export default router;
