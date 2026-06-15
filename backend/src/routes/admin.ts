import { Router, Request, Response } from 'express';

const router = Router();

// Example admin endpoint
router.get('/stats', async (_req: Request, res: Response) => {
  // Placeholder stats, replace with real logic
  res.json({ users: 0, posts: 0, comments: 0 });
});

export default router;
