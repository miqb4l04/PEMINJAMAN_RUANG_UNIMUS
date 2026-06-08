import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Booking } from '../types';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  MapPin, 
  Printer, 
  History,
  AlertTriangle,
  FileSearch,
  ArrowRight
} from 'lucide-react';
import SuratDisposisiModal from '../components/SuratDisposisiModal';
import { useAuth } from '../contexts/AuthContext';

export default function RiwayatPeminjaman() {
  const { user } = useAuth();
  const [riwayat, setRiwayat] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'SEMUA' | 'MENUNGGU' | 'DISETUJUI' | 'DITOLAK'>('SEMUA');
  
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchRiwayat();
  }, []);

  const fetchRiwayat = async () => {
    try {
      setLoading(true);
      const response = await api.get('/booking/history'); 
      setRiwayat(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Gagal mengambil data riwayat peminjaman', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'DISETUJUI') return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    if (s === 'DITOLAK_RT' || s === 'DITOLAK_KEPALA') return 'bg-rose-50 border-rose-200 text-rose-700';
    return 'bg-amber-50 border-amber-200 text-amber-700'; 
  };

  const getStatusIcon = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'DISETUJUI') return <CheckCircle2 className="w-4 h-4" />;
    if (s === 'DITOLAK_RT' || s === 'DITOLAK_KEPALA') return <XCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4 animate-pulse" />;
  };

  const getStatusLabel = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'DISETUJUI') return 'Disetujui Penuh';
    if (s === 'DITOLAK_RT' || s === 'DITOLAK_KEPALA') return 'Ditolak';
    if (s === 'MENUNGGU_RT') return 'Menunggu Validasi RT';
    if (s === 'MENUNGGU_KEPALA') return 'Menunggu SK Kepala';
    return 'Diproses';
  };

  const filteredRiwayat = riwayat.filter(b => {
    if (filter === 'SEMUA') return true;
    const s = (b.status || '').toUpperCase();
    if (filter === 'DISETUJUI' && s === 'DISETUJUI') return true;
    if (filter === 'DITOLAK' && (s === 'DITOLAK_RT' || s === 'DITOLAK_KEPALA')) return true;
    if (filter === 'MENUNGGU' && (s === 'MENUNGGU_RT' || s === 'MENUNGGU_KEPALA')) return true;
    return false;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in" id="riwayat-page">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 border border-slate-200 rounded-3xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <History className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest font-mono">Log Aktivitas</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Riwayat Peminjaman Saya</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">Pantau status persetujuan, alasan penolakan, dan cetak surat izin dari sini.</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto border border-slate-200 overflow-x-auto scrollbar-none">
          {['SEMUA', 'MENUNGGU', 'DISETUJUI', 'DITOLAK'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-xl font-bold text-[11px] transition-all cursor-pointer whitespace-nowrap border-none ${
                filter === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-3"></div>
          <p className="text-xs text-slate-500 font-bold">Mengambil data riwayat Anda...</p>
        </div>
      ) : filteredRiwayat.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="p-4 bg-white border border-slate-100 shadow-sm rounded-full inline-block text-slate-400">
            <FileSearch className="w-8 h-8 text-indigo-300" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">Belum Ada Riwayat Ditemukan</h4>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Anda belum memiliki jadwal dengan status "{filter}". Jika Anda baru saja mengajukan peminjaman, pastikan form sudah terkirim dengan benar.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRiwayat.map((b) => {
            const safeStatus = (b.status || '').toUpperCase();
            const isApproved = safeStatus === 'DISETUJUI';
            const isRejected = safeStatus === 'DITOLAK_RT' || safeStatus === 'DITOLAK_KEPALA';

            return (
              <div key={b.id} className="bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isApproved ? 'bg-emerald-500' : isRejected ? 'bg-rose-500' : 'bg-amber-400'}`} />

                <div className="pl-2 flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400">ID: #{b.id}</span>
                    <h4 className="font-black text-slate-800 text-sm">{b.ruang?.nama || 'Ruangan Sistem'}</h4>
                    <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {b.ruang?.gedung?.nama || 'Gedung UNIMUS'} (Lt. {b.ruang?.lantai})
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 text-[9px] font-extrabold rounded-full uppercase tracking-wider flex items-center gap-1 border ${getStatusStyle(b.status || '')}`}>
                    {getStatusIcon(b.status || '')}
                    {getStatusLabel(b.status || '')}
                  </span>
                </div>

                <div className="pl-2 grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Tanggal</span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" /> {b.tanggal}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Waktu</span>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" /> {b.waktuMulai} - {b.waktuSelesai}
                    </span>
                  </div>
                </div>

                <div className="pl-2 mb-4 flex-grow">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Keperluan:</span>
                  <p className="text-[11px] text-slate-600 font-semibold italic bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                    "{b.keperluan}"
                  </p>
                </div>

                {/* PERBAIKAN: Membaca b.catatanPenolakan sesuai Prisma Schema */}
                {b.catatanPenolakan && isRejected && (
                  <div className="pl-2 mb-4">
                    <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex gap-2 items-start text-rose-800">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      <div>
                        <span className="block text-[10px] font-black uppercase mb-0.5 text-rose-900">Alasan Penolakan:</span>
                        <p className="text-[10.5px] font-medium leading-relaxed">{b.catatanPenolakan}</p>
                      </div>
                    </div>
                  </div>
                )}

                {b.catatanPeralihan && (
                  <div className="pl-2 mb-4">
                    <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex gap-2 items-start text-blue-800">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                      <div>
                        <span className="block text-[10px] font-black uppercase mb-0.5 text-blue-900">Pemberitahuan Peralihan Ruang:</span>
                        <p className="text-[10.5px] font-medium leading-relaxed">{b.catatanPeralihan}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 pl-2 mt-auto">
                  {isApproved ? (
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-indigo-100 border-none"
                    >
                      <Printer className="w-4 h-4" /> Cetak Surat Izin (PDF)
                    </button>
                  ) : (
                    <div className="w-full py-2.5 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-slate-200 cursor-not-allowed">
                      Surat Belum Tersedia <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SuratDisposisiModal 
        booking={selectedBooking} 
        isOpen={selectedBooking !== null} 
        onClose={() => setSelectedBooking(null)} 
      />
    </div>
  );
}