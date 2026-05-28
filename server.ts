// server.ts
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import { PrismaClient, Role } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'unimus-super-secret-key-2026';

app.use(express.json());

// ==========================================
// --- MIDDLEWARES (KEAMANAN) ---
// ==========================================
interface AuthRequest extends Request {
  user?: { id: number; email: string; name: string; role: Role };
}

async function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token tidak ditemukan atau format salah' });
  }

  const token = authHeader.split(' ')[1];
  if (token === 'guest-token-session') {
    req.user = { id: 0, email: 'guest@unimus.ac.id', name: 'Pengunjung Umum', role: 'GUEST' };
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: Role };
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return res.status(401).json({ error: 'Pengguna tidak valid' });
    
    req.user = { id: user.id, email: user.email, name: user.name, role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sesi kedaluwarsa atau token tidak valid' });
  }
}

function authorize(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'Hak akses ditolak' });
    next();
  };
}

async function isRoomAvailable(ruangId: number, tanggal: string, mulai: string, selesai: string): Promise<boolean> {
  const conflictingBookings = await prisma.booking.findMany({
    where: { ruangId, tanggal, status: { notIn: ['DITOLAK_RT', 'DITOLAK_KEPALA'] } }
  });
  return !conflictingBookings.some(b => mulai < b.waktuSelesai && selesai > b.waktuMulai);
}

// ==========================================
// --- API ROUTES LENGKAP ---
// ==========================================

// 1. AUTHENTICATION
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email dan password harus diisi' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Email atau Password salah' });
  }
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

app.get('/api/auth/me', verifyToken, (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

// 2. GEDUNG
app.get('/api/gedung', verifyToken, async (req, res) => res.json(await prisma.gedung.findMany()));
app.post('/api/gedung', verifyToken, authorize('ADMIN_RT'), async (req, res) => {
  try { res.status(201).json(await prisma.gedung.create({ data: req.body })); } 
  catch (error) { res.status(400).json({ error: 'Kode gedung mungkin sudah terdaftar' }); }
});
app.put('/api/gedung/:id', verifyToken, authorize('ADMIN_RT'), async (req, res) => {
  try { res.json({ message: 'Diperbarui', gedung: await prisma.gedung.update({ where: { id: parseInt(req.params.id) }, data: { kode: req.body.kode, nama: req.body.nama, lokasi: req.body.lokasi } }) }); }
  catch (error) { res.status(400).json({ error: 'Gagal mengupdate gedung.' }); }
});
app.delete('/api/gedung/:id', verifyToken, authorize('ADMIN_RT'), async (req, res) => {
  try { await prisma.gedung.delete({ where: { id: parseInt(req.params.id) } }); res.json({ message: 'Gedung dihapus' }); } 
  catch (error) { res.status(400).json({ error: 'Gedung tidak dapat dihapus (masih ada ruangan).' }); }
});

// 3. RUANG
app.get('/api/ruang', verifyToken, async (req, res) => {
  const filter = req.query.gedungId ? { gedungId: parseInt(req.query.gedungId as string) } : {};
  res.json(await prisma.ruang.findMany({ where: filter, include: { gedung: true } }));
});
app.post('/api/ruang', verifyToken, authorize('ADMIN_RT'), async (req, res) => {
  try { res.status(201).json(await prisma.ruang.create({ data: { ...req.body, gedungId: parseInt(req.body.gedungId), kapasitas: parseInt(req.body.kapasitas), lantai: parseInt(req.body.lantai) } })); } 
  catch (error) { res.status(400).json({ error: 'Gagal membuat ruang.' }); }
});
app.put('/api/ruang/:id', verifyToken, authorize('ADMIN_RT'), async (req, res) => {
  try { res.json({ message: 'Diperbarui', ruang: await prisma.ruang.update({ where: { id: parseInt(req.params.id) }, data: { kode: req.body.kode, nama: req.body.nama, gedungId: parseInt(req.body.gedungId), lantai: parseInt(req.body.lantai), kapasitas: parseInt(req.body.kapasitas), jenis: req.body.jenis, fasilitas: req.body.fasilitas } }) }); }
  catch (error) { res.status(400).json({ error: 'Gagal update ruangan.' }); }
});
app.delete('/api/ruang/:id', verifyToken, authorize('ADMIN_RT'), async (req, res) => {
  try { await prisma.ruang.delete({ where: { id: parseInt(req.params.id) } }); res.json({ message: 'Ruang dihapus' }); } 
  catch (error) { res.status(400).json({ error: 'Gagal dihapus.' }); }
});
app.get('/api/ruang/available', verifyToken, async (req, res) => {
  const { tanggal, waktuMulai, waktuSelesai, kapasitas, gedungId } = req.query;
  if (!tanggal || !waktuMulai || !waktuSelesai) return res.status(400).json({ error: 'Parameter tidak lengkap' });
  let whereFilter: any = {};
  if (kapasitas) whereFilter.kapasitas = { gte: parseInt(kapasitas as string) };
  if (gedungId) whereFilter.gedungId = parseInt(gedungId as string);
  const ruangs = await prisma.ruang.findMany({ where: whereFilter, include: { gedung: true } });
  const availableRooms = [];
  for (const r of ruangs) {
    if (await isRoomAvailable(r.id, tanggal as string, waktuMulai as string, waktuSelesai as string)) availableRooms.push(r);
  }
  res.json(availableRooms);
});

// ==========================================
// 4. BOOKING & VALIDASI
// ==========================================

// A. Ajukan Booking (Mahasiswa)
app.post('/api/booking', verifyToken, authorize('MAHASISWA'), async (req: AuthRequest, res: Response) => {
  try {
    const { ruangId, tanggal, waktuMulai, waktuSelesai, keperluan } = req.body;
    if (!ruangId || !tanggal || !waktuMulai || !waktuSelesai || !keperluan) return res.status(400).json({ error: 'Semua data wajib diisi.' });

    const parsedRuangId = parseInt(ruangId);
    const isAvailable = await isRoomAvailable(parsedRuangId, tanggal, waktuMulai, waktuSelesai);
    if (!isAvailable) return res.status(409).json({ error: 'Ruang sudah dipesan pada jadwal tersebut.' });

    const newBooking = await prisma.booking.create({
      data: { userId: req.user!.id, ruangId: parsedRuangId, tanggal, waktuMulai, waktuSelesai, keperluan, status: 'MENUNGGU_RT' }
    });
    res.status(201).json({ message: 'Booking berhasil diajukan!', booking: newBooking });
  } catch (error: any) {
    res.status(500).json({ error: 'Terjadi kesalahan internal server.' });
  }
});

// B. Ambil Riwayat Pribadi (Khusus Mahasiswa)
app.get('/api/booking/user', verifyToken, authorize('MAHASISWA'), async (req: AuthRequest, res: Response) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user!.id },
      include: { ruang: { include: { gedung: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (error) { res.status(500).json({ error: 'Gagal memuat data.' }); }
});

// C. Ambil SEMUA Riwayat (Khusus Admin RT & Kepala RT) - INI YANG DIBUTUHKAN VALIDASIBOOKING.TSX
app.get('/api/booking/all', verifyToken, authorize('ADMIN_RT', 'KEPALA_RT'), async (req: AuthRequest, res: Response) => {
  try {
    const statusFilter = req.query.status ? { status: req.query.status as any } : {};
    const bookings = await prisma.booking.findMany({
      where: statusFilter,
      include: { 
        user: { select: { id: true, name: true, email: true, role: true } }, 
        ruang: { include: { gedung: true } } 
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(bookings);
  } catch (error) { res.status(500).json({ error: 'Gagal memuat data seluruh peminjaman.' }); }
});

// D. Validasi Bertingkat (Setuju/Tolak)
app.put('/api/booking/:id/validate', verifyToken, authorize('ADMIN_RT', 'KEPALA_RT'), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { action, alasan } = req.body; 
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return res.status(404).json({ error: 'Pengajuan tidak ditemukan' });

    let newStatus = booking.status;
    if (action === 'tolak') {
      newStatus = req.user!.role === 'ADMIN_RT' ? 'DITOLAK_RT' : 'DITOLAK_KEPALA';
    } else {
      newStatus = req.user!.role === 'ADMIN_RT' ? 'MENUNGGU_KEPALA' : 'DISETUJUI';
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: newStatus, catatanPenolakan: alasan || null }
    });
    res.json({ message: 'Validasi berhasil disimpan!', booking: updatedBooking });
  } catch (error) { res.status(500).json({ error: 'Gagal memproses validasi.' }); }
});

// E. Peralihan Ruangan (Transfer / Relocate)
app.put('/api/booking/:id/transfer', verifyToken, authorize('ADMIN_RT', 'KEPALA_RT'), async (req: AuthRequest, res: Response) => {
  try {
    const { newRuangId, alasan } = req.body;
    const updatedBooking = await prisma.booking.update({
      where: { id: parseInt(req.params.id) },
      data: { ruangId: parseInt(newRuangId), catatanPeralihan: alasan || 'Dialihkan otomatis' }
    });
    res.json({ message: `Berhasil dialihkan!`, booking: updatedBooking });
  } catch (error) { res.status(500).json({ error: 'Gagal mengalihkan ruangan.' }); }
});

// ==========================================
// 5. DASHBOARD STATISTIK
// ==========================================
app.get('/api/dashboard/stats', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const totalGedung = await prisma.gedung.count();
    const totalRuang = await prisma.ruang.count();

    if (req.user!.role === 'MAHASISWA') {
      // Statistik Mahasiswa: Hanya menghitung peminjamannya sendiri
      const myBookings = await prisma.booking.count({ where: { userId: req.user!.id } });
      const myApproved = await prisma.booking.count({ where: { userId: req.user!.id, status: 'DISETUJUI' } });
      const myPending = await prisma.booking.count({ 
        where: { userId: req.user!.id, status: { in: ['MENUNGGU_RT', 'MENUNGGU_KEPALA'] } } 
      });
      
      return res.json({ role: 'MAHASISWA', totalGedung, totalRuang, totalPeminjaman: myBookings, disetujui: myApproved, menunggu: myPending });
    } else {
      // Statistik Admin/Kepala RT: Menghitung seluruh aktivitas di kampus
      const totalPeminjaman = await prisma.booking.count();
      const disetujui = await prisma.booking.count({ where: { status: 'DISETUJUI' } });
      const menungguRT = await prisma.booking.count({ where: { status: 'MENUNGGU_RT' } });
      const menungguKepala = await prisma.booking.count({ where: { status: 'MENUNGGU_KEPALA' } });

      return res.json({ role: req.user!.role, totalGedung, totalRuang, totalPeminjaman, disetujui, menungguRT, menungguKepala });
    }
  } catch (error) {
    console.error("🚨 ERROR DASHBOARD:", error);
    res.status(500).json({ error: 'Gagal mengambil statistik dashboard.' });
  }
});

// ==========================================
// --- VITE WEB ENGINE INTEGRATION ---
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req: Request, res: Response) => res.sendFile(path.join(process.cwd(), 'dist', 'index.html')));
  }
  
  app.listen(PORT, "0.0.0.0" as any, () => {
    console.log(`UniRoom Server running smoothly on http://localhost:${PORT} 🚀`);
  });
}

startServer();