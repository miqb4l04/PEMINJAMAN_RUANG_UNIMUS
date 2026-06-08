export type Role = 'MAHASISWA' | 'ADMIN_RT' | 'KEPALA_RT' | 'GUEST';

export type BookingStatus =
  | 'MENUNGGU_RT'
  | 'MENUNGGU_KEPALA'
  | 'DISETUJUI'
  | 'DITOLAK_RT'
  | 'DITOLAK_KEPALA'
  | 'BUTUH_REVISI'; // [PERBAIKAN] Menambahkan status revisi

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  createdAt?: string;
}

export interface Gedung {
  id: number;
  kode: string;
  nama: string;
  lokasi: string;
}

export interface Ruang {
  id: number;
  kode: string;
  nama: string;
  gedungId: number;
  lantai: number;
  kapasitas: number;
  jenis: string;
  fasilitas?: string;
  gedung?: Gedung;
}

export interface Booking {
  id: number;
  userId: number;
  ruangId: number;
  tanggal: string; // YYYY-MM-DD
  waktuMulai: string; // HH:MM
  waktuSelesai: string; // HH:MM
  keperluan: string;
  status: BookingStatus;
  catatanPenolakan?: string;
  catatanPeralihan?: string;
  catatanRevisi?: string; // [PERBAIKAN] Menambahkan kolom untuk pesan revisi
  createdAt: string;
  user?: User;
  ruang?: Ruang;
}

export interface Notification {
  id: number;
  userId: number;
  pesan: string;   // [PERBAIKAN] Disesuaikan dengan schema.prisma (bukan message)
  dibaca: boolean; // [PERBAIKAN] Disesuaikan dengan schema.prisma (bukan isRead)
  createdAt: string;
}