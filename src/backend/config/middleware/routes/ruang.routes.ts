// src/backend/routes/ruang.routes.ts
import { Router } from 'express';
import { prisma } from '../config/prisma.ts';
import { verifyToken, authorize } from '../middleware/auth.ts';

const router = Router();

// Fungsi internal pengecekan tabrakan jadwal (conflict booking)
async function isRoomAvailable(ruangId: number, tanggal: string, mulai: string, selesai: string): Promise<boolean> {
  const conflictingBookings = await prisma.booking.findMany({
    where: {
      ruangId,
      tanggal,
      status: { notIn: ['DITOLAK_RT', 'DITOLAK_KEPALA'] },
    }
  });
  return !conflictingBookings.some(b => mulai < b.waktuSelesai && selesai > b.waktuMulai);
}

// 1. GET: Ambil semua data ruang
router.get('/', verifyToken, async (req, res) => {
  const { gedungId } = req.query;
  const filter = gedungId ? { gedungId: parseInt(gedungId as string) } : {};
  const ruangs = await prisma.ruang.findMany({ where: filter, include: { gedung: true } });
  res.json(ruangs);
});

// 2. POST: Tambah ruang baru
router.post('/', verifyToken, authorize('ADMIN_RT'), async (req, res) => {
  try {
    const data = { 
      ...req.body, 
      gedungId: parseInt(req.body.gedungId), 
      kapasitas: parseInt(req.body.kapasitas), 
      lantai: parseInt(req.body.lantai) 
    };
    const newRuang = await prisma.ruang.create({ data });
    res.status(201).json(newRuang);
  } catch (error) {
    res.status(400).json({ error: 'Gagal membuat ruang. Pastikan kode ruang unik.' });
  }
});

// 3. PUT: Edit data ruang (BARU DITAMBAHKAN)
router.put('/:id', verifyToken, authorize('ADMIN_RT'), async (req, res) => {
  try {
    const updatedRuang = await prisma.ruang.update({
      where: { id: parseInt(req.params.id) },
      data: {
        kode: req.body.kode,
        nama: req.body.nama,
        gedungId: parseInt(req.body.gedungId),
        lantai: parseInt(req.body.lantai),
        kapasitas: parseInt(req.body.kapasitas),
        jenis: req.body.jenis,
        fasilitas: req.body.fasilitas
      }
    });
    res.json({ message: 'Ruang berhasil diperbarui', ruang: updatedRuang });
  } catch (error) {
    res.status(400).json({ error: 'Gagal mengupdate ruang. Pastikan kode tidak kembar.' });
  }
});

// 4. DELETE: Hapus data ruang (BARU DITAMBAHKAN)
router.delete('/:id', verifyToken, authorize('ADMIN_RT'), async (req, res) => {
  try {
    await prisma.ruang.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Ruangan berhasil dihapus' });
  } catch (error) {
    res.status(400).json({ error: 'Ruangan tidak bisa dihapus karena sudah memiliki riwayat peminjaman aktif.' });
  }
});

// 5. GET: Fitur Rekomendasi/Pencarian Cerdas Ruang Kosong (Digunakan oleh Mahasiswa)
router.get('/available', verifyToken, async (req, res) => {
  const { tanggal, waktuMulai, waktuSelesai, kapasitas, gedungId } = req.query;
  if (!tanggal || !waktuMulai || !waktuSelesai) return res.status(400).json({ error: 'Parameter pencarian tidak lengkap' });

  let whereFilter: any = {};
  if (kapasitas) whereFilter.kapasitas = { gte: parseInt(kapasitas as string) };
  if (gedungId) whereFilter.gedungId = parseInt(gedungId as string);

  const ruangs = await prisma.ruang.findMany({ where: whereFilter, include: { gedung: true } });
  const availableRooms = [];
  
  for (const r of ruangs) {
    if (await isRoomAvailable(r.id, tanggal as string, waktuMulai as string, waktuSelesai as string)) {
      availableRooms.push(r);
    }
  }
  res.json(availableRooms);
});

export { isRoomAvailable };
export default router;