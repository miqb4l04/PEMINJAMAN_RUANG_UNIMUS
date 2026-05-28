// src/backend/routes/booking.routes.ts
import { Router, Response } from 'express';
import { prisma } from '../config/prisma';
import { verifyToken, authorize, AuthRequest } from '../middleware/auth';
import { isRoomAvailable } from './ruang.routes';

const router = Router();

// Ajukan Booking (Mahasiswa)
router.post('/', verifyToken, authorize('MAHASISWA'), async (req: AuthRequest, res: Response) => {
  const { ruangId, tanggal, waktuMulai, waktuSelesai, keperluan } = req.body;
  const parsedRuangId = parseInt(ruangId);
  
  const targetRoom = await prisma.ruang.findUnique({ where: { id: parsedRuangId } });
  if (!targetRoom) return res.status(404).json({ error: 'Ruangan tidak ditemukan' });

  const available = await isRoomAvailable(parsedRuangId, tanggal, waktuMulai, waktuSelesai);
  if (!available) {
    // Sistem Rekomendasi Otomatis jika ruangan penuh
    const alternatives = await prisma.ruang.findMany({
      where: { gedungId: targetRoom.gedungId, kapasitas: { gte: targetRoom.kapasitas }, id: { not: parsedRuangId } },
      include: { gedung: true }
    });

    for (const alt of alternatives.sort((a, b) => a.kapasitas - b.kapasitas)) {
      if (await isRoomAvailable(alt.id, tanggal, waktuMulai, waktuSelesai)) {
        return res.status(409).json({ error: 'Ruang sudah dipesan.', alternatif: alt });
      }
    }
    return res.status(409).json({ error: 'Ruang tidak tersedia dan tidak ada alternatif di gedung yang sama.' });
  }

  const admins = await prisma.user.findMany({ where: { role: 'ADMIN_RT' } });
  const notifData = admins.map(a => ({
    userId: a.id,
    message: `Mahasiswa ${req.user!.name} mengajukan peminjaman ruang ${targetRoom.nama} untuk keperluan ${keperluan}.`,
  }));

  const newBooking = await prisma.booking.create({
    data: {
      userId: req.user!.id, ruangId: parsedRuangId, tanggal, waktuMulai, waktuSelesai, keperluan, status: 'MENUNGGU_RT',
      notifications: { create: notifData }
    }
  });

  res.status(201).json({ message: 'Booking berhasil diajukan!', booking: newBooking });
});

// Validasi Bertingkat (Admin RT & Kepala RT)
router.put('/:id/validate', verifyToken, authorize('ADMIN_RT', 'KEPALA_RT'), async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { action, alasan } = req.body;
  const booking = await prisma.booking.findUnique({ where: { id }, include: { ruang: true } });
  if (!booking) return res.status(404).json({ error: 'Pengajuan tidak ditemukan' });

  let newStatus = booking.status;
  const notificationsToCreate = [];

  if (action === 'tolak') {
    newStatus = req.user!.role === 'ADMIN_RT' ? 'DITOLAK_RT' : 'DITOLAK_KEPALA';
    notificationsToCreate.push({ userId: booking.userId, message: `Peminjaman ruangan DITOLAK. Alasan: "${alasan}"` });
  } else {
    if (req.user!.role === 'ADMIN_RT') {
      newStatus = 'MENUNGGU_KEPALA';
      const kepalaRTs = await prisma.user.findMany({ where: { role: 'KEPALA_RT' } });
      kepalaRTs.forEach(k => notificationsToCreate.push({ userId: k.id, message: `Validasi tingkat 2 diperlukan untuk ruang ${booking.ruang.nama}.` }));
    } else {
      newStatus = 'DISETUJUI';
      notificationsToCreate.push({ userId: booking.userId, message: `Peminjaman ruangan DISETUJUI penuh oleh Kepala RT.` });
    }
  }

  const updatedBooking = await prisma.booking.update({
    where: { id },
    data: { status: newStatus, catatanPenolakan: alasan || null, notifications: { create: notificationsToCreate } }
  });

  res.json({ message: 'Validasi berhasil disimpan!', booking: updatedBooking });
});

// Pengalihan Ruangan (Relocate)
router.put('/:id/transfer', verifyToken, authorize('ADMIN_RT', 'KEPALA_RT'), async (req: AuthRequest, res: Response) => {
  const { newRuangId, alasan } = req.body;
  const booking = await prisma.booking.findUnique({ where: { id: parseInt(req.params.id) }, include: { ruang: true } });
  if (!booking) return res.status(404).json({ error: 'Peminjaman tidak ditemukan' });

  const newRoom = await prisma.ruang.findUnique({ where: { id: parseInt(newRuangId) } });
  if (!newRoom) return res.status(404).json({ error: 'Ruang tujuan tidak ditemukan' });

  if (!(await isRoomAvailable(newRoom.id, booking.tanggal, booking.waktuMulai, booking.waktuSelesai))) {
    return res.status(400).json({ error: `Ruangan "${newRoom.nama}" sedang terpakai agenda lain.` });
  }

  const explanation = alasan || 'Dialihkan otomatis untuk agenda mendesak Universitas';
  const updatedBooking = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      ruangId: newRoom.id,
      catatanPeralihan: explanation,
      notifications: {
        create: {
          userId: booking.userId,
          message: `🔄 PERALIHAN RUANG: Peminjaman #${booking.id} dialihkan ke "${newRoom.nama}". Alasan: ${explanation}`
        }
      }
    }
  });

  res.json({ message: `Berhasil dialihkan ke ${newRoom.nama}!`, booking: updatedBooking });
});

// Ambil Semua Riwayat (Admin / Kepala)
router.get('/all', verifyToken, authorize('ADMIN_RT', 'KEPALA_RT'), async (req, res) => {
  const statusFilter = req.query.status ? { status: req.query.status as any } : {};
  const bookings = await prisma.booking.findMany({
    where: statusFilter,
    include: { user: { select: { id: true, name: true, email: true, role: true } }, ruang: { include: { gedung: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(bookings);
});

// Ambil Riwayat Pribadi (Mahasiswa)
router.get('/user', verifyToken, async (req: AuthRequest, res: Response) => {
  const bookings = await prisma.booking.findMany({
    where: { userId: req.user!.id },
    include: { ruang: { include: { gedung: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(bookings);
});

export default router;