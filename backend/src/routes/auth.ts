import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// Placeholder user store – replace with real DB model
const users: { [email: string]: { passwordHash: string; id: string } } = {};

const router = Router();

// Register endpoint
router.post('/register', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }
  if (users[email]) {
    return res.status(409).json({ message: 'User already exists' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const userId = Date.now().toString();
  users[email] = { passwordHash, id: userId };
  res.status(201).json({ message: 'User created', userId });
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = users[email];
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, email }, process.env.JWT_SECRET ?? 'secret', { expiresIn: '1h' });
  res.json({ token });
});

export default router;