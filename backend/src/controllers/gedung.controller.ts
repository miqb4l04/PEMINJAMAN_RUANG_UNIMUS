import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthRequest } from '../middleware/auth.js';

export const getGedung = async (req: AuthRequest, res: Response) => {
  try {
    const gedungs = await prisma.gedung.findMany({ orderBy: { kode: 'asc' } });
    res.json(gedungs);
  } catch (error) {
    console.error("Error GET Gedung:", error);
    res.status(500).json({ error: 'Gagal mengambil data gedung' });
  }
};

export const createGedung = async (req: AuthRequest, res: Response) => {
  try {
    const newGedung = await prisma.gedung.create({ data: req.body });
    res.status(201).json(newGedung);
  } catch (error) {
    console.error("Error POST Gedung:", error);
    res.status(400).json({ error: 'Kode gedung sudah terdaftar atau data tidak valid' });
  }
};

export const updateGedung = async (req: AuthRequest, res: Response) => {
  try {
    const updatedGedung = await prisma.gedung.update({
      where: { id: parseInt(req.params.id) },
      data: { kode: req.body.kode, nama: req.body.nama, lokasi: req.body.lokasi }
    });
    res.json({ message: 'Gedung berhasil diperbarui', gedung: updatedGedung });
  } catch (error) {
    console.error("Error PUT Gedung:", error);
    res.status(400).json({ error: 'Gagal mengupdate gedung. Pastikan kode tidak kembar.' });
  }
};

export const deleteGedung = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.gedung.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Gedung berhasil dihapus' });
  } catch (error) {
    console.error("Error DELETE Gedung:", error);
    res.status(400).json({ error: 'Gedung tidak bisa dihapus karena masih terhubung dengan data ruangan' });
  }
};