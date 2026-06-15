import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';

const router = Router();

// Get all posts
router.get('/', async (_req: Request, res: Response) => {
  const posts = await prisma.post.findMany();
  res.json(posts);
});

// Get a single post by ID
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const post = await prisma.post.findUnique({ where: { id: Number(id) } });
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.json(post);
});

// Create a new post
router.post('/', async (req: Request, res: Response) => {
  const { title, content, authorId } = req.body;
  const newPost = await prisma.post.create({
    data: { title, content, authorId: Number(authorId) },
  });
  res.status(201).json(newPost);
});

// Update a post
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content } = req.body;
  const updated = await prisma.post.update({
    where: { id: Number(id) },
    data: { title, content },
  });
  res.json(updated);
});

// Delete a post
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.post.delete({ where: { id: Number(id) } });
  res.status(204).send();
});

export default router;
