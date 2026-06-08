import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Booking } from '../types';
import { 
  Calendar, Clock, AlertOctagon, CheckCircle2, 
  RotateCcw, Building2, Activity, FileText, 
  Pencil, Info, CalendarX2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast'; // <--- IMPORT TOAST
import SuratDisposisiModal from '../components/SuratDisposisiModal';
import LoadingSpinner from '../components/LoadingSpinner'; // <--- IMPORT SPINNER
import EmptyState from '../components/EmptyState'; // <--- IMPORT EMPTY STATE

export default function Riwayat() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(true);
  const [selectedDisposisi, setSelectedDisposisi] = useState<Booking | null>(null);

  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({ tanggal: '', waktuMulai: '', waktuSelesai: '', keperluan: '' });
  const [editLoading, setEditLoading] = useState(false);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await api.get('/booking/history');
      setBookings(data);
    } catch (err) {
      console.error('Failed to load user bookings', err);
      toast.error('Gagal mengambil data riwayat peminjaman!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const openEditModal = (b: Booking) => {
    setEditingBooking(b);
    setEditForm({
      tanggal: b.tanggal,
      waktuMulai: b.waktuMulai,
      waktuSelesai: b.waktuSelesai,
      keperluan: b.keperluan
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    if (editForm.waktuMulai >= editForm.waktuSelesai) {
      toast.error('Jam Mulai tidak boleh lebih besar atau sama dengan Jam Selesai!');
      return; 
    }

    setEditLoading(true);
    try {
      await api.put(`/booking/${editingBooking.id}/edit`, editForm);
      setEditingBooking(null);
      loadBookings(); 
      toast.success('Pengajuan berhasil direvisi dan dikirim ulang!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Gagal merevisi pengajuan. Jadwal mungkin bentrok.');
    } finally {
      setEditLoading(false);
    }
  };

  const getStatusBadge = (rawStatus: string) => {
    const status = rawStatus as string;
    switch (status) {
      case 'BUTUH_REVISI':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold rounded-full transition-all">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            Revisi Diperlukan!
          </span>
        );
      case 'MENUNGGU_RT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold rounded-full transition-all">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Menunggu Verifikasi RT
          </span>
        );
      case 'MENUNGGU_KEPALA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 text-yellow-800 text-xs font-bold rounded-full transition-all">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
            Menunggu Kepala RT
          </span>
        );
      case 'DISETUJUI':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full transition-all">
            <span className="w-3.5 h-3.5 text-emerald-500">✅</span> Disetujui Penuh
          </span>
        );
      case 'DITOLAK_RT':
      case 'DITOLAK_KEPALA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-full transition-all">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-500" /> Ditolak
          </span>
        );
      default:
        return <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">{status}</span>;
    }
  };

  const formatDateString = (rawDate: string) => {
    try {
      const parts = rawDate.split('T')[0].split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
      return rawDate;
    } catch (e) {
      return rawDate;
    }
  };

  // 1. TAMPILAN JIKA SEDANG LOADING (Menggunakan komponen premium)
  if (loading && bookings.length === 0) {
    return (
      <div className="pt-10">
        <LoadingSpinner text="Membaca arsip data Anda..." />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6 max-w-5xl mx-auto pb-10" id="user-booking-history">
      <div className="flex justify-between items-center bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-600" />
            Riwayat & Revisi Ruangan
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Pantau status dan revisi permohonan peminjaman prasarana Anda.</p>
        </div>
        <button 
          onClick={() => {
            loadBookings();
            toast.success('Data berhasil diperbarui!');
          }} 
          className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl transition-all cursor-pointer" 
          title="Refresh Data"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* 2. TAMPILAN JIKA DATA KOSONG (Menggunakan EmptyState Premium) */}
      {bookings.length === 0 ? (
        <EmptyState 
          icon={<CalendarX2 className="w-12 h-12 text-slate-400" />}
          title="Belum Ada Reservasi Aktif"
          description="Anda belum pernah melakukan peminjaman ruangan. Silakan kunjungi menu Cari Ruang untuk memulai permohonan pertama Anda!"
          action={
            <button 
              onClick={() => toast('Silakan buka menu Cari Ruang di Sidebar sebelah kiri', { icon: '👉' })}
              className="px-6 py-2.5 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              Mulai Pinjam Ruangan
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {bookings.slice(0, limit).map((booking: Booking) => {
            const currentStatus = booking.status as string; 
            const isEditable = currentStatus === 'MENUNGGU_RT' || currentStatus === 'BUTUH_REVISI';
            
            return (
            <div key={booking.id} className={`bg-white border rounded-2xl shadow-sm p-5 transition-all ${currentStatus === 'BUTUH_REVISI' ? 'border-blue-200 bg-blue-50/10 shadow-blue-100' : 'border-slate-100'}`}>
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                <div className="space-y-3.5 flex-grow">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="py-0.5 px-2 bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono text-xs font-bold rounded">Ref #{booking.id}</span>
                    {getStatusBadge(currentStatus)}
                  </div>

                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-1.5">
                      <Building2 className="w-4.5 h-4.5 text-slate-400 flex-shrink-0" />
                      {booking.ruang?.nama || `Ruangan ${booking.ruangId}`}
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold">{booking.ruang?.gedung?.nama || 'UNIMUS'} • Lantai {booking.ruang?.lantai}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 w-fit">
                    <div className="flex items-center gap-1"><Calendar className="w-4 h-4 text-indigo-500" /> {formatDateString(booking.tanggal)}</div>
                    <div className="flex items-center gap-1"><Clock className="w-4 h-4 text-indigo-500" /> {booking.waktuMulai} - {booking.waktuSelesai} WIB</div>
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    <span className="font-bold block text-slate-400 uppercase text-[9px] mb-1">Tujuan Keperluan</span>
                    {booking.keperluan}
                  </div>

                  {booking.catatanPenolakan && (
                    <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-rose-800 text-xs space-y-0.5">
                      <span className="font-extrabold block text-[10px] text-rose-500 uppercase flex items-center gap-1"><AlertOctagon className="w-3 h-3"/> Alasan Penolakan:</span>
                      <p className="italic mt-1">"{booking.catatanPenolakan}"</p>
                    </div>
                  )}

                  {booking.catatanRevisi && (
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 text-xs space-y-0.5 shadow-sm">
                      <span className="font-extrabold block text-[10px] text-blue-600 uppercase flex items-center gap-1"><Info className="w-3 h-3"/> Pesan Revisi dari Admin:</span>
                      <p className="italic mt-1 font-semibold">"{booking.catatanRevisi}"</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    {currentStatus === 'DISETUJUI' && (
                      <button onClick={() => setSelectedDisposisi(booking)} className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-[11px] rounded-xl flex items-center gap-1.5 transition-all cursor-pointer">
                        <FileText className="w-3.5 h-3.5" /> Cetak Surat Izin
                      </button>
                    )}

                    {isEditable && (
                      <button onClick={() => openEditModal(booking)} className={`px-4 py-2 border font-extrabold text-[11px] rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${currentStatus === 'BUTUH_REVISI' ? 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700 shadow-indigo-200' : 'bg-white hover:bg-slate-50 text-indigo-600 border-indigo-200'}`}>
                        <Pencil className="w-3.5 h-3.5" /> Edit / Revisi Pengajuan
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-mono text-left lg:text-right shrink-0">
                  Diajukan pada:<br />{new Date(booking.createdAt).toLocaleString('id-ID')}
                </div>
              </div>
            </div>
            );
          })}

          {bookings.length > limit && (
            <div className="flex justify-center pt-3">
              <button onClick={() => setLimit(prev => prev + 5)} className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 flex items-center gap-2 cursor-pointer transition-colors">
                Tampilkan Lebih Banyak Riwayat
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. MODAL EDIT PENGAJUAN (Dibersihkan dari state error manual karena sudah pakai Toast) */}
      <AnimatePresence>
        {editingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-indigo-500" /> Formulir Revisi
                </h3>
              </div>
              
              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div className="p-3 bg-indigo-50 text-indigo-800 text-xs rounded-xl font-medium border border-indigo-100 flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5"/>
                  Meresave formulir ini akan mengembalikan status Anda menjadi "Menunggu Verifikasi" agar dapat dicek ulang oleh Admin.
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-xs font-extrabold text-slate-500 uppercase">Tanggal</label>
                    <input type="date" required value={editForm.tanggal} onChange={e => setEditForm({...editForm, tanggal: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-500 uppercase">Jam Mulai</label>
                    <input type="time" required value={editForm.waktuMulai} onChange={e => setEditForm({...editForm, waktuMulai: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-500 uppercase">Jam Selesai</label>
                    <input type="time" required value={editForm.waktuSelesai} onChange={e => setEditForm({...editForm, waktuSelesai: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-500 uppercase">Perjelas Keperluan</label>
                  <textarea required rows={3} value={editForm.keperluan} onChange={e => setEditForm({...editForm, keperluan: e.target.value})} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setEditingBooking(null)} className="px-5 py-2.5 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 cursor-pointer">Batalkan</button>
                  <button type="submit" disabled={editLoading} className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-200 flex items-center gap-2">
                    {editLoading ? 'Menyimpan...' : 'Simpan & Ajukan Ulang'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedDisposisi && <SuratDisposisiModal booking={selectedDisposisi} isOpen={selectedDisposisi !== null} onClose={() => setSelectedDisposisi(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}