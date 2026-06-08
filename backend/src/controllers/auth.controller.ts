import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'unimus-super-secret-key-2026';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email dan password harus diisi' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Email atau Password salah' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat login' });
  }
};

export const loginGuest = (req: Request, res: Response) => {
  const guestUser = { id: 9999, email: 'guest@unimus.ac.id', name: 'Tamu (Guest)', role: 'GUEST' };
  const token = jwt.sign(guestUser, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, user: guestUser });
};

export const getMe = (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role === 'GUEST') {
      return res.status(403).json({ error: 'Sesi Tamu tidak diizinkan mengubah profil.' });
    }

    const { name, email } = req.body;
    const userId = req.user!.id;

    if (!name || !email) return res.status(400).json({ error: 'Nama dan email tidak boleh kosong' });

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail && existingEmail.id !== userId) {
      return res.status(400).json({ error: 'Email sudah digunakan oleh akun lain' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name, email },
      select: { id: true, name: true, email: true, role: true }
    });

    res.json({ message: 'Profil berhasil diperbarui', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Gagal memperbarui profil' });
  }
};

export const updatePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user!.role === 'GUEST') {
      return res.status(403).json({ error: 'Sesi Tamu tidak memiliki password untuk diubah.' });
    }

    const { oldPassword, newPassword } = req.body;
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Password saat ini salah' });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    res.json({ message: 'Password berhasil diubah' });
  } catch (error) {
    res.status(500).json({ error: 'Gagal memperbarui password' });
  }
};