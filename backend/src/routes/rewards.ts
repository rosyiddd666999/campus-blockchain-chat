import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';

const router = Router();

// Get all rewards
router.get('/', async (_req: Request, res: Response) => {
  const rewards = await prisma.reward.findMany();
  res.json(rewards);
});

// Get a reward by ID
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const reward = await prisma.reward.findUnique({ where: { id: Number(id) } });
  if (!reward) return res.status(404).json({ message: 'Reward not found' });
  res.json(reward);
});

// Create a new reward
router.post('/', async (req: Request, res: Response) => {
  const { userId, amount, action, txHash } = req.body;
  const newReward = await prisma.reward.create({
    data: { userId: Number(userId), amount: Number(amount), action, txHash },
  });
  res.status(201).json(newReward);
});

// Update a reward
router.put('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount, action, txHash } = req.body;
  const updated = await prisma.reward.update({
    where: { id: Number(id) },
    data: { amount: Number(amount), action, txHash },
  });
  res.json(updated);
});

// Delete a reward
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.reward.delete({ where: { id: Number(id) } });
  res.status(204).send();
});

export default router;
