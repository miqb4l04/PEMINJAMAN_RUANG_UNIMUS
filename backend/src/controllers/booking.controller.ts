import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthRequest } from '../middleware/auth.js';
import { isRoomAvailable } from '../utils/bookingUtils.js';

export const createBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { ruangId, tanggal, waktuMulai, waktuSelesai, keperluan } = req.body;
    
    if (!ruangId || !tanggal || !waktuMulai || !waktuSelesai || !keperluan) {
      return res.status(400).json({ error: 'Mohon lengkapi semua data formulir peminjaman.' });
    }

    if (waktuMulai >= waktuSelesai) {
      return res.status(400).json({ error: 'Jam Mulai tidak boleh lebih besar atau sama dengan Jam Selesai.' });
    }

    const parsedRuangId = parseInt(ruangId);
    const targetRoom = await prisma.ruang.findUnique({ where: { id: parsedRuangId } });
    if (!targetRoom) return res.status(404).json({ error: 'Ruangan yang dicari tidak ditemukan.' });

    const available = await isRoomAvailable(parsedRuangId, tanggal, waktuMulai, waktuSelesai);
    
    if (!available) {
      const alternatives = await prisma.ruang.findMany({
        where: { gedungId: targetRoom.gedungId, kapasitas: { gte: targetRoom.kapasitas }, id: { not: parsedRuangId } },
        include: { gedung: true }
      });

      for (const alt of alternatives.sort((a: any, b: any) => a.kapasitas - b.kapasitas)) {
        if (await isRoomAvailable(alt.id, tanggal, waktuMulai, waktuSelesai)) {
          return res.status(409).json({ error: 'Ruang yang Anda pilih sudah dipesan.', alternatif: alt });
        }
      }
      return res.status(409).json({ error: 'Ruang penuh dan tidak ada alternatif lain yang tersisa.' });
    }

    // TANGGAL DISIMPAN SEBAGAI STRING (Sesuai schema Prisma Anda)
    const newBooking = await prisma.booking.create({
      data: {
        userId: req.user!.id, 
        ruangId: parsedRuangId, 
        tanggal: tanggal, 
        waktuMulai, 
        waktuSelesai, 
        keperluan, 
        status: 'MENUNGGU_RT' as any 
      }
    });

    const admins = await prisma.user.findMany({ where: { role: 'ADMIN_RT' as any } });
    const notifData = admins.map((a: any) => ({
      userId: a.id,
      pesan: `Mahasiswa ${req.user!.name} mengajukan peminjaman ruang ${targetRoom.nama} untuk keperluan: ${keperluan}.`,
    }));

    notifData.push({
      userId: req.user!.id, 
      pesan: `Terkirim: Pengajuan ruang ${targetRoom.nama} Anda sedang menunggu validasi Admin.`
    });

    if (notifData.length > 0) {
      await prisma.notification.createMany({ data: notifData });
    }

    res.status(201).json({ message: 'Booking berhasil diajukan!', booking: newBooking });
  } catch (error: any) {
    console.error("Error POST Booking:", error);
    res.status(500).json({ error: 'Terjadi kesalahan internal server saat memproses booking.' });
  }
};

export const validateBooking = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { action, alasan } = req.body;
    
    const booking = await prisma.booking.findUnique({ where: { id }, include: { ruang: true } });
    if (!booking) return res.status(404).json({ error: 'Pengajuan tidak ditemukan di database.' });

    let newStatus = booking.status as string;
    const notificationsToCreate = [];
    const safeRole = (req.user!.role || '').toString().toUpperCase();

    if (action === 'tolak') {
      newStatus = safeRole.includes('ADMIN') ? 'DITOLAK_RT' : 'DITOLAK_KEPALA';
      notificationsToCreate.push({ userId: booking.userId, pesan: `❌ Peminjaman ruang ${booking.ruang.nama} DITOLAK. Alasan: "${alasan}"` });
    } else if (action === 'revisi') {
      newStatus = 'BUTUH_REVISI';
      notificationsToCreate.push({ userId: booking.userId, pesan: `⚠️ Pengajuan ruang ${booking.ruang.nama} DIKEMBALIKAN. Catatan Admin: "${alasan}"` });
    } else {
      if (safeRole.includes('ADMIN') && !safeRole.includes('KEPALA')) {
        newStatus = 'MENUNGGU_KEPALA';
        const kepalaRTs = await prisma.user.findMany({ where: { role: 'KEPALA_RT' as any } });
        kepalaRTs.forEach((k: any) => notificationsToCreate.push({ userId: k.id, pesan: `Otorisasi Validasi Tingkat 2 diperlukan untuk pengajuan ruang ${booking.ruang.nama}.` }));
      } else {
        newStatus = 'DISETUJUI';
        notificationsToCreate.push({ userId: booking.userId, pesan: `✅ Peminjaman ruang ${booking.ruang.nama} telah DISETUJUI penuh! Silakan cetak Surat Disposisi Anda.` });
      }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { 
        status: newStatus as any, 
        catatanPenolakan: action === 'tolak' ? (alasan || 'Tidak memenuhi kriteria peminjaman') : null,
        catatanRevisi: action === 'revisi' ? alasan : null
      }
    });

    if (notificationsToCreate.length > 0) {
      await prisma.notification.createMany({ data: notificationsToCreate });
    }

    res.json({ message: 'Proses validasi berhasil disimpan.', booking: updatedBooking });
  } catch (error: any) {
    console.error("Error PUT Validate:", error);
    res.status(500).json({ error: 'Terjadi kesalahan internal server saat memvalidasi pengajuan.' });
  }
};

export const editBooking = async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { tanggal, waktuMulai, waktuSelesai, keperluan } = req.body;

    if (waktuMulai >= waktuSelesai) {
      return res.status(400).json({ error: 'Jam Mulai tidak boleh lebih besar atau sama dengan Jam Selesai.' });
    }
    
    const booking = await prisma.booking.findUnique({ where: { id }, include: { ruang: true } });
    if (!booking) return res.status(404).json({ error: 'Peminjaman tidak ditemukan.' });
    if (booking.userId !== req.user!.id) return res.status(403).json({ error: 'Akses ditolak.' });

    const currentStatus = booking.status as string;
    if (currentStatus !== 'MENUNGGU_RT' && currentStatus !== 'BUTUH_REVISI') {
      return res.status(400).json({ error: 'Hanya pengajuan berstatus Menunggu RT atau Butuh Revisi yang dapat diedit.' });
    }

    const available = await isRoomAvailable(booking.ruangId, tanggal, waktuMulai, waktuSelesai, id);
    if (!available) {
      return res.status(409).json({ error: 'Jadwal revisi Anda bentrok dengan pengguna lain di jam/tanggal tersebut.' });
    }

    // TANGGAL DISIMPAN SEBAGAI STRING
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        tanggal: tanggal,
        waktuMulai,
        waktuSelesai,
        keperluan,
        status: 'MENUNGGU_RT' as any,
        catatanRevisi: null 
      }
    });

    const admins = await prisma.user.findMany({ where: { role: 'ADMIN_RT' as any } });
    const notifData = admins.map((a: any) => ({
      userId: a.id,
      pesan: `🔄 Mahasiswa ${req.user!.name} telah MEREVISI form pengajuan ruang ${booking.ruang.nama}. Silakan divalidasi ulang.`,
    }));
    if (notifData.length > 0) await prisma.notification.createMany({ data: notifData });

    res.json({ message: 'Pengajuan berhasil direvisi dan dikirim ulang!', booking: updatedBooking });
  } catch (error: any) {
    console.error("Error EDIT Booking:", error);
    res.status(500).json({ error: 'Terjadi kesalahan saat menyimpan revisi Anda.' });
  }
};

export const transferBooking = async (req: AuthRequest, res: Response) => {
  try {
    const { newRuangId, alasan } = req.body;
    const booking = await prisma.booking.findUnique({ where: { id: parseInt(req.params.id) }, include: { ruang: true } });
    if (!booking) return res.status(404).json({ error: 'Peminjaman tidak ditemukan.' });

    const newRoom = await prisma.ruang.findUnique({ where: { id: parseInt(newRuangId) } });
    if (!newRoom) return res.status(404).json({ error: 'Ruang target tujuan tidak ditemukan.' });

    const explanation = alasan || 'Dialihkan otomatis oleh Biro RT untuk kelancaran agenda mendesak Universitas';
    
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: { ruangId: newRoom.id, catatanPeralihan: explanation }
    });

    await prisma.notification.create({
      data: {
        userId: booking.userId, 
        pesan: `🔄 PERHATIAN: Peminjaman #${booking.id} Anda dialihkan ke "${newRoom.nama}". Alasan Biro: ${explanation}`
      }
    });

    res.json({ message: `Berhasil mengalihkan mahasiswa ke ${newRoom.nama}!`, booking: updatedBooking });
  } catch (error: any) {
    console.error("Error PUT Transfer:", error);
    res.status(500).json({ error: 'Terjadi kesalahan saat memproses perpindahan ruang.' });
  }
};

export const getAllBookings = async (req: AuthRequest, res: Response) => {
  try {
    const statusFilter = req.query.status ? { status: req.query.status as any } : {};
    const bookings = await prisma.booking.findMany({
      where: statusFilter,
      include: { user: { select: { id: true, name: true, email: true, role: true } }, ruang: { include: { gedung: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (error: any) {
    console.error("Error GET All Bookings:", error);
    res.status(500).json({ error: 'Gagal mengambil data seluruh booking.' });
  }
};

export const getMyHistory = async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user!.id },
      include: { ruang: { include: { gedung: true } } },
      orderBy: { createdAt: 'desc' } 
    });
    res.json(bookings);
  } catch (error: any) {
    console.error("Error GET History:", error);
    res.status(500).json({ error: 'Gagal mengambil riwayat.' });
  }
};