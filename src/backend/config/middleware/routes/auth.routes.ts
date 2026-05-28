// src/backend/routes/auth.routes.ts
import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'unimus-super-secret-key-2026';

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email dan password harus diisi' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Email atau Password salah' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

// Get Me (Cek Sesi Login)
router.get('/me', verifyToken, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

// Update Profile
router.put('/profile', verifyToken, async (req: AuthRequest, res: Response) => {
  if (req.user!.role === 'GUEST') return res.status(400).json({ error: 'Guest tidak dapat mengedit profil' });
  
  const { name, email } = req.body;
  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name, email },
      select: { id: true, email: true, name: true, role: true }
    });
    res.json({ message: 'Profil diperbarui', user: updatedUser });
  } catch (error) {
    res.status(400).json({ error: 'Email sudah digunakan atau data tidak valid.' });
  }
});

export default router;