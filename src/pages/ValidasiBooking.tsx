import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { Booking, Ruang } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { 
  CheckCircle2, 
  XCircle, 
  UserCircle2, 
  Calendar, 
  Clock, 
  RotateCcw, 
  ShieldCheck, 
  Mail, 
  MapPin, 
  ArrowRightLeft, 
  Info, 
  Sparkles,
  ArrowRight,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SuratDisposisiModal from '../components/SuratDisposisiModal';

export default function ValidasiBooking() {
  const { user } = useAuth();
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [ruangs, setRuangs] = useState<Ruang[]>([]);
  const [loading, setLoading] = useState(true);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);
  const [selectedDisposisi, setSelectedDisposisi] = useState<Booking | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'all_active'>('pending');

  const [relocateBookingId, setRelocateBookingId] = useState<number | null>(null);
  const [selectedNewRoomId, setSelectedNewRoomId] = useState<string>('');
  const [relocateReason, setRelocateReason] = useState<string>('');
  const [transferring, setTransferring] = useState(false);

  const [simulationStep, setSimulationStep] = useState<number>(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      setSuccessInfo(null);
      setErrorInfo(null);
      
      const bookingsJson = await apiRequest<Booking[]>('/booking/all');
      setAllBookings(Array.isArray(bookingsJson) ? bookingsJson : []);

      const ruangsJson = await apiRequest<Ruang[]>('/ruang');
      setRuangs(Array.isArray(ruangsJson) ? ruangsJson : []);
    } catch (err) {
      console.error('Failed to load data in validation panel', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleValidate = async (id: number, action: 'setuju' | 'tolak') => {
    let alasan = '';
    
    if (action === 'tolak') {
      const inputVal = prompt('Masukkan alasan penolakan secara jelas (Wajib diisi):');
      if (inputVal === null) return;
      if (!inputVal.trim()) {
        alert('Gagal! Alasan penolakan tidak boleh kosong.');
        return;
      }
      alasan = inputVal.trim();
    }

    try {
      setErrorInfo(null);
      await apiRequest(`/booking/${id}/validate`, {
        method: 'PUT',
        body: JSON.stringify({ action, alasan }),
      });

      setSuccessInfo(
        action === 'setuju'
          ? 'Sukses menyetujui peminjaman! Status diteruskan ke tingkat berikutnya.'
          : 'Sukses menolak peminjaman! Notifikasi alasan penolakan terkirim ke mahasiswa.'
      );
      fetchData();
    } catch (err: any) {
      setErrorInfo(err.message || 'Gagal menyimpan validasi peminjaman.');
    }
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relocateBookingId || !selectedNewRoomId) {
      alert('Pilih ruang alternatif terlebih dahulu!');
      return;
    }

    try {
      setTransferring(true);
      setErrorInfo(null);
      
      const payload = {
        newRuangId: selectedNewRoomId,
        alasan: relocateReason.trim() || 'Dialihkan otomatis oleh Biro RT karena kebutuhan agenda resmi rektorat universitas'
      };

      const res = await apiRequest<any>(`/booking/${relocateBookingId}/transfer`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      setSuccessInfo(res.message);
      setRelocateBookingId(null);
      setSelectedNewRoomId('');
      setRelocateReason('');
      fetchData();
    } catch (err: any) {
      setErrorInfo(err.message || 'Gagal mengalihkan ruangan.');
    } finally {
      setTransferring(false);
    }
  };

  const handleTriggerSimulation = async () => {
    try {
      setLoading(true);
      setErrorInfo(null);
      setSuccessInfo(null);

      const targetRoom = ruangs[0] || { id: 101, nama: 'GKB-101' };
      const today = new Date().toISOString().substring(0, 10);

      await apiRequest('/booking', {
        method: 'POST',
        body: JSON.stringify({
          ruangId: targetRoom.id,
          tanggal: today,
          waktuMulai: '13:00',
          waktuSelesai: '15:00',
          keperluan: 'Kuliah Umum & Webinar Nasional Himpunan Mahasiswa Keperawatan'
        })
      });

      setSuccessInfo(`[SIMULASI BERHASIL] Langkah 1: Sistem mendeteksi Mahasiswa berhasil memesan ruangan "${targetRoom.nama}" untuk tanggal ${today} (13:00 - 15:00).`);
      setSimulationStep(1);
      fetchData();
    } catch (err: any) {
      setErrorInfo(err.message || 'Gagal membuat simulasi pemesanan.');
      setLoading(false);
    }
  };

  const resetSimulation = () => {
    setSimulationStep(0);
    setSuccessInfo(null);
    setErrorInfo(null);
  };

  // --- FILTER ANTI-TYPO ---
  const expectedPendingStatus = user?.role === 'ADMIN_RT' ? 'MENUNGGU_RT' : 'MENUNGGU_KEPALA';
  const filteredBookings = allBookings.filter(b => {
    const safeStatus = (b.status || '').toUpperCase();
    if (activeSubTab === 'pending') {
      return safeStatus === expectedPendingStatus;
    } else {
      return ['MENUNGGU_RT', 'MENUNGGU_KEPALA', 'DISETUJUI'].includes(safeStatus);
    }
  });

  const getBadgeTitle = () => {
    if (user?.role === 'ADMIN_RT') return 'Verifikasi Tingkat 1 & Peralihan RT';
    if (user?.role === 'KEPALA_RT') return 'Persetujuan Final & Otorisasi Kebijakan RT';
    return 'Biro Validasi & Peralihan Ruangan';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6 max-w-5xl mx-auto" 
      id="validation-peminjaman-page"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 border border-slate-100 rounded-3xl shadow-sm">
        <div>
          <span className="inline-block px-2.5 py-0.5 bg-indigo-50 text-indigo-700 font-bold font-mono text-[10px] rounded-full uppercase tracking-wider mb-1">
            Wewenang Biro: {user?.role}
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            {getBadgeTitle()}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Validasi pengajuan, kelola bentrok jadwal, dan lakukan peralihan ruangan instan jika universitas memerlukan ruangan tersebut.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 font-bold text-xs"
        >
          <RotateCcw className="w-4 h-4" />
          Segarkan Data
        </button>
      </div>

      <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-emerald-500/5 border border-indigo-100 rounded-3xl p-6 relative overflow-hidden shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">Interactive Sandbox: Simulasi Bentrok / Kasus Peralihan Ruang</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Ingin melihat bagaimana sistem menangani <strong>Peralihan Ruangan (Relocation)</strong>? Anda dapat mencontohkan kasus di mana mahasiswa sudah menjadwalkan acara, namun Universitas tiba-tiba harus memakai ruangan yang sama untuk rapat penting Rektorat Kampus.
            </p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-indigo-50/50 space-y-3.5">
          {simulationStep === 0 ? (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="text-xs text-slate-500 font-medium leading-relaxed">
                👉 Klik tombol kanan untuk memulai simulasi. Ini akan membuat peminjaman mahasiswa di ruang pertama secara instan di database.
              </div>
              <button
                onClick={handleTriggerSimulation}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm shadow-indigo-100 flex items-center gap-1.5 transition-all shrink-0"
              >
                1. Mulai Contoh Simulasi Bentrok
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : simulationStep === 1 ? (
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 text-amber-900 text-xs rounded-xl border border-amber-100 font-semibold leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>[KASUS BENTROK TERPADU]:</strong> Mahasiswa telah berhasil memesan ruang <strong>"{ruangs[0]?.nama || 'GKB-101'}"</strong>.
                  <p className="mt-1 text-slate-600 font-normal">
                    Sekarang, bayangkan panitia universitas / Dekan ingin mensahkan acara rektorat penting di waktu yang sama. Daripada menolak kaku pemesanan mahasiswa, Anda dipersilahkan menggeser/mengalihkan (<strong>Peralihan Ruang</strong>) mahasiswa tersebut ke ruangan kosong lainnya.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => {
                    setActiveSubTab('all_active');
                    setSimulationStep(2);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5 transition-all"
                >
                  2. Cari & Alihkan Jadwal Bentrok
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={resetSimulation}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] rounded-lg transition-all"
                >
                  Reset Simulasi
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="text-xs text-slate-600 font-medium leading-relaxed">
                🎉 <strong>Selesai!</strong> Anda sudah diarahkan ke tab <strong>"Semua Jadwal"</strong> di bawah. Carilah Peminjaman dengan keperluan <em>"Webinar Nasional Himpunan"</em>, lalu klik tombol <strong>"Alihkan Ruang"</strong> untuk memindahkannya ke kelas/gedung alternatif tanpa menghapus datanya.
              </div>
              <button
                onClick={resetSimulation}
                className="px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-900 font-bold text-[10px] rounded-lg transition-all cursor-pointer"
              >
                Tutup Simulasi
              </button>
            </div>
          )}
        </div>
      </div>

      {successInfo && (
        <div className="p-4.5 bg-emerald-50 border border-emerald-150 text-emerald-900 text-xs rounded-2xl font-bold animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 animate-bounce" />
          <span>{successInfo}</span>
        </div>
      )}

      {errorInfo && (
        <div className="p-4.5 bg-rose-50 border border-rose-150 text-rose-900 text-xs rounded-2xl font-bold animate-fade-in flex items-center gap-2">
          <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorInfo}</span>
        </div>
      )}

      <div className="flex bg-slate-100 border border-slate-200 p-1.5 rounded-2xl gap-1.5 max-w-lg">
        <button
          onClick={() => {
            setActiveSubTab('pending');
            setRelocateBookingId(null);
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none ${
            activeSubTab === 'pending'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'hover:bg-slate-50 text-slate-500'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Perlu Validasi ({allBookings.filter(b => (b.status || '').toUpperCase() === expectedPendingStatus).length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('all_active');
            setRelocateBookingId(null);
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none ${
            activeSubTab === 'all_active'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'hover:bg-slate-50 text-slate-500'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Semua Jadwal ({allBookings.filter(b => ['MENUNGGU_RT', 'MENUNGGU_KEPALA', 'DISETUJUI'].includes((b.status || '').toUpperCase())).length})</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-2"></div>
          <p className="text-sm text-slate-500 font-bold tracking-wide">Mendata reservasi...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="border border-slate-200 rounded-3xl bg-slate-50/50 p-12 text-center text-slate-400 max-w-md mx-auto space-y-4">
          <div className="p-3 bg-white border border-slate-100 shadow-sm rounded-full inline-block text-slate-400">
            <ShieldCheck className="w-6 h-6 text-slate-350" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">Tidak Ada Jadwal Terkait</h4>
            <p className="text-xs text-slate-500 mt-1.5 px-4 leading-relaxed">
              {activeSubTab === 'pending'
                ? `Hebat! Seluruh pengajuan peminjaman tingkat ${user?.role === 'ADMIN_RT' ? '1' : '2'} sudah diproses secara bersih.`
                : 'Belum ada jadwal peminjaman aktif yang terdaftar di sistem.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredBookings.map(b => {
            const isRelocating = relocateBookingId === b.id;
            const isSimulatedTarget = simulationStep >= 1 && (b.keperluan || '').includes('Himpunan Mahasiswa Keperawatan');
            const safeStatus = (b.status || '').toUpperCase();

            return (
              <div
                key={b.id}
                className={`bg-white border rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col md:flex-row justify-between gap-5 relative overflow-hidden ${
                  isSimulatedTarget ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/10' : 'border-slate-100'
                }`}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  safeStatus === 'DISETUJUI' 
                    ? 'bg-emerald-500' 
                    : b.catatanPeralihan
                    ? 'bg-blue-500 animate-pulse'
                    : 'bg-indigo-600'
                }`} />

                <div className="space-y-4 flex-grow pl-1 md:pl-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="py-0.5 px-2 bg-slate-100 text-slate-700 font-mono text-xs font-bold rounded">
                      ID Peminjaman #{b.id}
                    </span>
                    <span className={`py-0.5 px-2.5 text-[10px] font-bold rounded-full uppercase tracking-wider border ${
                      safeStatus === 'DISETUJUI'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : safeStatus === 'MENUNGGU_KEPALA'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-amber-50 border-amber-200 text-amber-750'
                    }`}>
                      {safeStatus === 'DISETUJUI' ? 'Disetujui Penuh' : safeStatus === 'MENUNGGU_KEPALA' ? 'Menunggu Tingkat 2' : 'Menunggu Tingkat 1'}
                    </span>
                    
                    {b.catatanPeralihan && (
                      <span className="py-0.5 px-2.5 bg-blue-100 border border-blue-300 text-blue-800 text-[10px] font-extrabold rounded-full animate-pulse flex items-center gap-1">
                        🔄 Hasil Peralihan Ruang
                      </span>
                    )}
                  </div>

                  <div className="flex gap-3 items-start bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
                    <UserCircle2 className="w-9 h-9 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-0.5 max-w-lg">
                      <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Peminjam</span>
                      <h4 className="font-extrabold text-slate-800 text-sm leading-snug">{b.user?.name || 'Mahasiswa UNIMUS'}</h4>
                      <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {b.user?.email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none">Ruang Yang Dijadwalkan</span>
                    <div className="flex gap-1.5 items-center">
                      <MapPin className="w-4.5 h-4.5 text-rose-500 flex-shrink-0" />
                      <h5 className="font-black text-slate-800 text-sm leading-tight">
                        {b.ruang?.nama || `Ruangan (ID: ${b.ruangId})`}
                      </h5>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-w-sm pt-1">
                    <div className="bg-slate-50 border border-slate-100/60 p-2 rounded-xl">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Main</span>
                      <span className="text-xs font-bold text-slate-800 block mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        {b.tanggal}
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100/60 p-2 rounded-xl">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Jam</span>
                      <span className="text-xs font-bold text-slate-800 block mt-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        {b.waktuMulai} - {b.waktuSelesai}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 bg-amber-50/20 border border-amber-250/60 p-3 rounded-2xl">
                    <span className="block text-[9px] font-bold text-amber-800 uppercase tracking-wider">Tujuan Acara Kegiatan:</span>
                    <p className="text-xs text-slate-700 italic font-semibold leading-relaxed">
                      "{b.keperluan}"
                    </p>
                  </div>

                  <AnimatePresence>
                    {isRelocating && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleExecuteTransfer}
                        className="p-4 bg-slate-50 border border-indigo-100 rounded-2xl space-y-3 mt-3 relative overflow-hidden"
                      >
                        <h4 className="text-xs font-black text-slate-900">Form Peralihan Ruang Otomatis</h4>
                        
                        <div className="space-y-2">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase">Pilih Ruang Alternatif:</label>
                          <select
                            value={selectedNewRoomId}
                            onChange={(e) => setSelectedNewRoomId(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-hidden font-bold"
                            required
                          >
                            <option value="">-- Cari Ruang Alternatif Yang Lowong --</option>
                            {ruangs.filter(r => r.id !== b.ruangId).map(r => (
                              <option key={r.id} value={r.id}>{r.nama} (Kapasitas: {r.kapasitas})</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase">Alasan Peralihan:</label>
                          <input
                            type="text"
                            value={relocateReason}
                            onChange={(e) => setRelocateReason(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                          />
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          <button type="button" onClick={() => setRelocateBookingId(null)} className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-lg cursor-pointer">Batal</button>
                          <button type="submit" disabled={transferring} className="px-4 py-1.5 bg-indigo-650 hover:bg-slate-800 text-white font-extrabold text-xs rounded-lg cursor-pointer disabled:opacity-50">Eksekusi Alihan Ruang</button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>

                <div className="md:w-56 flex flex-col justify-center gap-3 bg-slate-50 md:bg-white p-4 md:p-0 rounded-2xl md:rounded-none border-t md:border-t-0 md:border-l border-slate-100 md:pl-5 shrink-0">
                  <span className="text-[10px] text-slate-400 font-semibold block text-center md:text-left mb-1">
                    Biro Otorisasi & Peralihan:
                  </span>
                  
                  {activeSubTab === 'pending' && (
                    <>
                      <button onClick={() => handleValidate(b.id, 'setuju')} className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4.5 h-4.5" /> Setuju (Lanjutkan)
                      </button>

                      <button onClick={() => handleValidate(b.id, 'tolak')} className="w-full py-2.5 px-4 bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5">
                        <XCircle className="w-4.5 h-4.5" /> Tolak Pengajuan
                      </button>
                    </>
                  )}

                  {!isRelocating && (
                    <button onClick={() => { setRelocateBookingId(b.id); setSelectedNewRoomId(''); setRelocateReason(''); }} className="w-full py-2.5 px-4 bg-slate-100 text-indigo-750 border border-slate-200 font-extrabold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5">
                      <ArrowRightLeft className="w-4 h-4" /> Alihkan Ruangan
                    </button>
                  )}

                  {safeStatus === 'DISETUJUI' && (
                    <button onClick={() => setSelectedDisposisi(b)} className="w-full py-2.5 px-4 bg-[#dcfce7] text-emerald-800 border border-emerald-250 font-extrabold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1.5">
                      <FileText className="w-4 h-4" /> Cetak Disposisi
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {selectedDisposisi && (
          <SuratDisposisiModal booking={selectedDisposisi} isOpen={selectedDisposisi !== null} onClose={() => setSelectedDisposisi(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}