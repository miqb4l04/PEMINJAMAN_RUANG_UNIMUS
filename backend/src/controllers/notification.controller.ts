import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Sesi tidak valid" });
    if (req.user.role === 'GUEST') return res.json([]);

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 30
    });
    res.json(notifications);
  } catch (error) {
    console.error("Error GET Notifications:", error);
    res.status(500).json({ error: "Gagal mengambil data notifikasi" });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Sesi tidak valid" });
    await prisma.notification.updateMany({
      where: { userId: req.user.id, dibaca: false }, data: { dibaca: true }
    });
    res.json({ message: "Semua notifikasi telah dibaca" });
  } catch (error) {
    console.error("Error PUT Read-All:", error);
    res.status(500).json({ error: "Gagal menandai notifikasi" });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Sesi tidak valid" });
    await prisma.notification.updateMany({
      where: { id: parseInt(req.params.id), userId: req.user.id }, data: { dibaca: true }
    });
    res.json({ message: "Notifikasi telah dibaca" });
  } catch (error) {
    console.error("Error PUT Read One:", error);
    res.status(500).json({ error: "Gagal mengupdate notifikasi" });
  }
};