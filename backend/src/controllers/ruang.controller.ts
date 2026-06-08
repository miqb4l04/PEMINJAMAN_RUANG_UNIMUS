import { Response } from 'express';
import { prisma } from '../config/prisma.js';
import { AuthRequest } from '../middleware/auth.js';
import { isRoomAvailable } from '../utils/bookingUtils.js';

export const getRuang = async (req: AuthRequest, res: Response) => {
  try {
    const { gedungId } = req.query;
    let filter: any = {};
    
    if (gedungId && String(gedungId).trim() !== '' && String(gedungId) !== 'all') {
      const parsedId = parseInt(String(gedungId));
      if (!isNaN(parsedId)) filter.gedungId = parsedId;
    }
    
    const ruangs = await prisma.ruang.findMany({ 
      where: filter, include: { gedung: true }, orderBy: { kode: 'asc' } 
    });
    res.json(ruangs);
  } catch (error) {
    console.error("Error GET Ruang:", error);
    res.status(500).json({ error: 'Gagal mengambil data ruang' });
  }
};

export const createRuang = async (req: AuthRequest, res: Response) => {
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
    console.error("Error POST Ruang:", error);
    res.status(400).json({ error: 'Gagal membuat ruang. Pastikan kode ruang unik.' });
  }
};

export const updateRuang = async (req: AuthRequest, res: Response) => {
  try {
    const updatedRuang = await prisma.ruang.update({
      where: { id: parseInt(req.params.id) },
      data: {
        kode: req.body.kode, nama: req.body.nama, gedungId: parseInt(req.body.gedungId),
        lantai: parseInt(req.body.lantai), kapasitas: parseInt(req.body.kapasitas),
        jenis: req.body.jenis, fasilitas: req.body.fasilitas
      }
    });
    res.json({ message: 'Ruang berhasil diperbarui', ruang: updatedRuang });
  } catch (error) {
    console.error("Error PUT Ruang:", error);
    res.status(400).json({ error: 'Gagal mengupdate ruang. Pastikan kode tidak kembar.' });
  }
};

export const deleteRuang = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.ruang.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Ruangan berhasil dihapus' });
  } catch (error) {
    console.error("Error DELETE Ruang:", error);
    res.status(400).json({ error: 'Ruangan tidak bisa dihapus karena sudah memiliki riwayat peminjaman aktif.' });
  }
};

export const getAvailableRuang = async (req: AuthRequest, res: Response) => {
  try {
    const { tanggal, waktuMulai, waktuSelesai, kapasitas, gedungId } = req.query;
    
    if (!tanggal || !waktuMulai || !waktuSelesai) {
      return res.status(400).json({ error: 'Parameter pencarian (tanggal, waktu mulai, selesai) tidak lengkap' });
    }

    let whereFilter: any = {};
    if (kapasitas && String(kapasitas).trim() !== '') {
      const parsedKapasitas = parseInt(String(kapasitas));
      if (!isNaN(parsedKapasitas)) whereFilter.kapasitas = { gte: parsedKapasitas };
    }

    if (gedungId && String(gedungId).trim() !== '' && String(gedungId) !== 'all') {
      const parsedGedungId = parseInt(String(gedungId));
      if (!isNaN(parsedGedungId)) whereFilter.gedungId = parsedGedungId;
    }

    const ruangs = await prisma.ruang.findMany({ 
      where: whereFilter, include: { gedung: true }, orderBy: { nama: 'asc' }
    });
    
    const availableRooms = [];
    for (const r of ruangs) {
      const isAvail = await isRoomAvailable(r.id, String(tanggal), String(waktuMulai), String(waktuSelesai));
      if (isAvail) availableRooms.push(r);
    }
    
    res.json(availableRooms);
  } catch (error: any) {
    console.error("🔥 CRASH API /available:", error);
    res.status(500).json({ error: 'Terjadi kesalahan internal saat mencari ruangan' });
  }
};