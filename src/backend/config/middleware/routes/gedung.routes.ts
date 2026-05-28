// src/backend/routes/gedung.routes.ts
import { Router } from 'express';
import { prisma } from '../config/prisma.ts';
import { verifyToken, authorize } from '../middleware/auth.ts';

const router = Router();

// 1. GET: Ambil semua data gedung
router.get('/', verifyToken, async (req, res) => {
  const gedungs = await prisma.gedung.findMany();
  res.json(gedungs);
});

// 2. POST: Tambah gedung baru
router.post('/', verifyToken, authorize('ADMIN_RT'), async (req, res) => {
  try {
    const newGedung = await prisma.gedung.create({ data: req.body });
    res.status(201).json(newGedung);
  } catch (error) {
    res.status(400).json({ error: 'Kode gedung sudah terdaftar' });
  }
});

// 3. PUT: Edit data gedung (INI YANG BARU DITAMBAHKAN)
router.put('/:id', verifyToken, authorize('ADMIN_RT'), async (req, res) => {
  try {
    const updatedGedung = await prisma.gedung.update({
      where: { id: parseInt(req.params.id) },
      data: {
        kode: req.body.kode,
        nama: req.body.nama,
        lokasi: req.body.lokasi
      }
    });
    res.json({ message: 'Gedung berhasil diperbarui', gedung: updatedGedung });
  } catch (error) {
    res.status(400).json({ error: 'Gagal mengupdate gedung. Pastikan kode tidak kembar.' });
  }
});

// 4. DELETE: Hapus gedung
router.delete('/:id', verifyToken, authorize('ADMIN_RT'), async (req, res) => {
  try {
    await prisma.gedung.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Gedung berhasil dihapus' });
  } catch (error) {
    res.status(400).json({ error: 'Gedung tidak bisa dihapus karena masih terhubung dengan data ruangan' });
  }
});

export default router;