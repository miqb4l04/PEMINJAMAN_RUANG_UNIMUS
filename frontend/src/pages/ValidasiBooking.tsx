import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Booking, Ruang } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, XCircle, UserCircle2, Calendar, Clock, RotateCcw, ShieldCheck, Mail, ArrowRightLeft, Info, FileText, PenTool } from 'lucide-react';
import toast from 'react-hot-toast'; // <--- IMPORT TOAST
import SuratDisposisiModal from '../components/SuratDisposisiModal';
import LoadingSpinner from '../components/LoadingSpinner'; // <--- IMPORT SPINNER
import EmptyState from '../components/EmptyState'; // <--- IMPORT EMPTY STATE

export default function ValidasiBooking() {
  const { user } = useAuth();
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [ruangs, setRuangs] = useState<Ruang[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDisposisi, setSelectedDisposisi] = useState<Booking | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'all_active'>('pending');
  const [relocateBookingId, setRelocateBookingId] = useState<number | null>(null);
  const [selectedNewRoomId, setSelectedNewRoomId] = useState<string>('');
  const [relocateReason, setRelocateReason] = useState<string>('');
  const [transferring, setTransferring] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const bookingsJson = await api.get('/booking/all');
      setAllBookings(Array.isArray(bookingsJson) ? bookingsJson : []);
      const ruangsJson = await api.get('/ruang');
      setRuangs(Array.isArray(ruangsJson) ? ruangsJson : []);
    } catch (err) {
      toast.error('Gagal mengambil data jadwal terbaru.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleValidate = async (id: number, action: 'setuju' | 'tolak' | 'revisi') => {
    let alasan = '';
    
    if (action === 'tolak' || action === 'revisi') {
      const inputVal = prompt(
        action === 'tolak' 
          ? 'Masukkan alasan penolakan secara jelas (Wajib):' 
          : 'Masukkan catatan instruksi REVISI untuk mahasiswa (Wajib):'
      );
      if (inputVal === null) return;
      if (!inputVal.trim()) {
        toast.error('Gagal! Alasan/Catatan tidak boleh kosong.');
        return;
      }
      alasan = inputVal.trim();
    }

    try {
      await api.put(`/booking/${id}/validate`, { action, alasan });
      if(action === 'setuju') toast.success('Peminjaman Disetujui! Status diteruskan.');
      if(action === 'revisi') toast.success('Pengajuan dikembalikan ke mahasiswa untuk direvisi.');
      if(action === 'tolak') toast.success('Peminjaman Ditolak! Notifikasi terkirim.');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Gagal memproses validasi.');
    }
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relocateBookingId || !selectedNewRoomId) { toast.error('Pilih ruang alternatif!'); return; }
    try {
      setTransferring(true);
      await api.put(`/booking/${relocateBookingId}/transfer`, {
        newRuangId: selectedNewRoomId,
        alasan: relocateReason.trim() || 'Dialihkan otomatis oleh Biro RT'
      });
      toast.success('Peralihan ruang berhasil dieksekusi.');
      setRelocateBookingId(null); setSelectedNewRoomId(''); setRelocateReason('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal mengalihkan ruangan.');
    } finally {
      setTransferring(false);
    }
  };

  const expectedPendingStatus = user?.role === 'ADMIN_RT' ? 'MENUNGGU_RT' : 'MENUNGGU_KEPALA';
  const filteredBookings = allBookings.filter((b: Booking) => {
    const safeStatus = ((b.status as string) || '').toUpperCase();
    if (activeSubTab === 'pending') {
      return safeStatus === expectedPendingStatus;
    } else {
      return ['MENUNGGU_RT', 'MENUNGGU_KEPALA', 'DISETUJUI', 'BUTUH_REVISI'].includes(safeStatus);
    }
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 border border-slate-100 rounded-3xl shadow-sm">
        <div>
          <span className="inline-block px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold font-mono text-[10px] rounded-full uppercase tracking-wider mb-1">
            Wewenang Biro: {user?.role || 'SISTEM'}
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" /> Validasi & Peralihan
          </h2>
          <p className="text-xs text-slate-500 mt-1">Setujui, tolak, minta revisi, atau lakukan peralihan ruangan instan.</p>
        </div>
        <button onClick={() => { fetchData(); toast.success('Data diperbarui'); }} className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200 rounded-xl cursor-pointer inline-flex items-center gap-1.5 font-bold text-xs shadow-sm bg-white">
          <RotateCcw className="w-4 h-4" /> Segarkan Data
        </button>
      </div>

      <div className="flex bg-slate-100 border border-slate-200 p-1.5 rounded-2xl gap-1.5 max-w-lg">
        <button onClick={() => { setActiveSubTab('pending'); setRelocateBookingId(null); }} className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none ${activeSubTab === 'pending' ? 'bg-white text-indigo-700 shadow-sm' : 'hover:bg-slate-50 text-slate-500'}`}>
          <ShieldCheck className="w-4 h-4" /> Perlu Validasi ({allBookings.filter(b => ((b.status as string) || '').toUpperCase() === expectedPendingStatus).length})
        </button>
        <button onClick={() => { setActiveSubTab('all_active'); setRelocateBookingId(null); }} className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none ${activeSubTab === 'all_active' ? 'bg-white text-indigo-700 shadow-sm' : 'hover:bg-slate-50 text-slate-500'}`}>
          <ArrowRightLeft className="w-4 h-4" /> Semua Jadwal
        </button>
      </div>

      {loading ? (
        <div className="py-10">
          <LoadingSpinner text="Memeriksa antrean validasi..." />
        </div>
      ) : filteredBookings.length === 0 ? (
        <EmptyState 
          icon={<CheckCircle2 className="w-12 h-12 text-emerald-400" />}
          title="Tidak Ada Antrean"
          description="Bagus! Tidak ada jadwal peminjaman ruangan yang menunggu validasi dari Anda saat ini."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredBookings.map((b: Booking) => {
            const isRelocating = relocateBookingId === b.id;
            const safeStatus = ((b.status as string) || '').toUpperCase(); 

            return (
              <div key={b.id} className="bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all p-6 flex flex-col md:flex-row justify-between gap-5 relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  safeStatus === 'DISETUJUI' ? 'bg-emerald-500' : 
                  safeStatus === 'BUTUH_REVISI' ? 'bg-blue-400' :
                  b.catatanPeralihan ? 'bg-blue-500 animate-pulse' : 'bg-indigo-600'
                }`} />

                <div className="space-y-4 flex-grow pl-1 md:pl-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="py-0.5 px-2 bg-slate-100 text-slate-700 font-mono text-xs font-bold rounded">ID #{b.id}</span>
                    <span className={`py-0.5 px-2.5 text-[10px] font-bold rounded-full uppercase tracking-wider border ${
                      safeStatus === 'DISETUJUI' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                      safeStatus === 'BUTUH_REVISI' ? 'bg-blue-50 border-blue-300 text-blue-700' :
                      safeStatus === 'MENUNGGU_KEPALA' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      {safeStatus === 'DISETUJUI' ? 'Disetujui Penuh' : safeStatus === 'BUTUH_REVISI' ? 'Menunggu Revisi' : safeStatus === 'MENUNGGU_KEPALA' ? 'Menunggu Tingkat 2' : 'Menunggu Tingkat 1'}
                    </span>
                  </div>

                  <div className="flex gap-3 items-start bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                    <UserCircle2 className="w-9 h-9 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Peminjam</span>
                      <h4 className="font-extrabold text-slate-800 text-sm leading-snug">{b.user?.name || 'Mahasiswa UNIMUS'}</h4>
                      <p className="text-[11px] text-slate-500 font-mono"><Mail className="w-3 h-3 inline mr-1" />{b.user?.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-w-sm">
                    <div className="bg-slate-50 border border-slate-100/60 p-2 rounded-xl">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tanggal</span>
                      <span className="text-xs font-bold text-slate-800 mt-0.5 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-indigo-500" />{b.tanggal}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100/60 p-2 rounded-xl">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Jam</span>
                      <span className="text-xs font-bold text-slate-800 mt-0.5 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-indigo-500" />{b.waktuMulai} - {b.waktuSelesai}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1 bg-amber-50/20 border border-amber-200/60 p-3 rounded-2xl">
                    <span className="block text-[9px] font-bold text-amber-800 uppercase tracking-wider">Tujuan Acara:</span>
                    <p className="text-xs text-slate-700 italic font-semibold">"{b.keperluan}"</p>
                  </div>

                  {isRelocating && (
                    <form onSubmit={handleExecuteTransfer} className="p-4 bg-slate-50 border border-indigo-100 rounded-2xl space-y-3 mt-3">
                      <h4 className="text-xs font-black text-slate-900">Form Peralihan Ruang Otomatis</h4>
                      <select value={selectedNewRoomId} onChange={(e) => setSelectedNewRoomId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-indigo-600" required>
                        <option value="">-- Cari Ruang Alternatif --</option>
                        {ruangs.filter(r => r.id !== b.ruangId).map(r => <option key={r.id} value={r.id}>{r.nama} (Kap: {r.kapasitas})</option>)}
                      </select>
                      <input type="text" placeholder="Alasan Peralihan..." value={relocateReason} onChange={(e) => setRelocateReason(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-indigo-600" />
                      <div className="flex gap-2 justify-end pt-1">
                        <button type="button" onClick={() => setRelocateBookingId(null)} className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-lg cursor-pointer">Batal</button>
                        <button type="submit" disabled={transferring} className="px-4 py-1.5 bg-indigo-600 text-white font-extrabold text-xs rounded-lg cursor-pointer border-none">{transferring ? 'Memproses...' : 'Eksekusi'}</button>
                      </div>
                    </form>
                  )}
                </div>

                <div className="md:w-56 flex flex-col justify-center gap-2.5 bg-slate-50 md:bg-white p-4 md:p-0 rounded-2xl md:rounded-none border-t md:border-t-0 md:border-l border-slate-100 md:pl-5 shrink-0">
                  <span className="text-[10px] text-slate-400 font-semibold block text-center md:text-left mb-1">Aksi Validasi:</span>
                  
                  {activeSubTab === 'pending' && safeStatus !== 'BUTUH_REVISI' && (
                    <>
                      <button onClick={() => handleValidate(b.id, 'setuju')} className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 border-none">
                        <CheckCircle2 className="w-4 h-4" /> Setuju
                      </button>
                      <button onClick={() => handleValidate(b.id, 'revisi')} className="w-full py-2.5 px-4 bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 hover:bg-blue-100">
                        <PenTool className="w-4 h-4" /> Minta Revisi
                      </button>
                      <button onClick={() => handleValidate(b.id, 'tolak')} className="w-full py-2.5 px-4 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 hover:bg-rose-100">
                        <XCircle className="w-4 h-4" /> Tolak
                      </button>
                    </>
                  )}

                  {!isRelocating && safeStatus !== 'BUTUH_REVISI' && (
                    <button onClick={() => { setRelocateBookingId(b.id); setSelectedNewRoomId(''); setRelocateReason(''); }} className="w-full py-2.5 px-4 bg-slate-100 text-indigo-700 border border-slate-200 font-extrabold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 hover:bg-slate-200 mt-2">
                      <ArrowRightLeft className="w-4 h-4" /> Alihkan
                    </button>
                  )}

                  {safeStatus === 'DISETUJUI' && (
                    <button onClick={() => setSelectedDisposisi(b)} className="w-full py-2.5 px-4 bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5 hover:bg-emerald-100">
                      <FileText className="w-4 h-4" /> Disposisi
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedDisposisi && <SuratDisposisiModal booking={selectedDisposisi} isOpen={selectedDisposisi !== null} onClose={() => setSelectedDisposisi(null)} />}
    </div>
  );
}