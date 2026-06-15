import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';

const router = Router();

// Get comments for a post
router.get('/post/:postId', async (req: Request, res: Response) => {
  const { postId } = req.params;
  const comments = await prisma.comment.findMany({ where: { postId: Number(postId) } });
  res.json(comments);
});

// Add a comment
router.post('/', async (req: Request, res: Response) => {
  const { postId, authorId, content } = req.body;
  const newComment = await prisma.comment.create({
    data: { postId: Number(postId), authorId: Number(authorId), content },
  });
  res.status(201).json(newComment);
});

export default router;