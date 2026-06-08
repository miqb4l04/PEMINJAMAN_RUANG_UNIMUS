import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, School, Search, ArrowRight, 
  AlertTriangle, Armchair, Layers, Sparkles, SlidersHorizontal,
  CalendarDays, X, Check, Building, BookmarkCheck, Info, Flame, History
} from 'lucide-react';
import toast from 'react-hot-toast'; // <--- IMPORT TOAST
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Gedung, Ruang } from '../types';

import LoadingSpinner from '../components/LoadingSpinner'; // <--- IMPORT SPINNER
import EmptyState from '../components/EmptyState'; // <--- IMPORT EMPTY STATE

const getLocalDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentTimeStr = () => {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export default function CariRuang() {
  const { user } = useAuth();
  
  const [gedungs, setGedungs] = useState<Gedung[]>([]);
  const [allRuangs, setAllRuangs] = useState<Ruang[]>([]);
  const [ruangList, setRuangList] = useState<Ruang[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [keperluan, setKeperluan] = useState('');
  const [alternatif, setAlternatif] = useState<Ruang | null>(null);

  const todayStr = getLocalDateStr();

  const [filters, setFilters] = useState({
    tanggal: todayStr,
    waktuMulai: '08:00',
    waktuSelesai: '10:00',
    kapasitas: '',
    gedungId: '',
  });

  const [activeTab, setActiveTab ] = useState<'list' | 'weekly'>('list');
  const [limitAvailable, setLimitAvailable] = useState(6);
  const [limitWeekly, setLimitWeekly] = useState(6);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLantai, setSelectedLantai] = useState<string>('');
  const [selectedJenis, setSelectedJenis] = useState<string>('');
  const [onlyLargeCapacity, setOnlyLargeCapacity] = useState<boolean>(false);

  const [weeklyDates, setWeeklyDates] = useState<string[]>([]);
  const [weeklyAvailability, setWeeklyAvailability] = useState<{ [dateStr: string]: Ruang[] }>({});
  const [loadingWeekly, setLoadingWeekly] = useState(false);

  const getFormatIndoDay = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
    } catch {
      return dateStr;
    }
  };

  useEffect(() => {
    const dates = [];
    const baseDate = new Date(filters.tanggal);
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }
    setWeeklyDates(dates);
  }, [filters.tanggal]);

  useEffect(() => {
    async function loadInitialDataset() {
      try {
        const buildingsData = await api.get('/gedung');
        setGedungs(Array.isArray(buildingsData) ? buildingsData : []);
        const roomsAll = await api.get('/ruang');
        setAllRuangs(Array.isArray(roomsAll) ? roomsAll : []);
      } catch (err) {
        toast.error('Gagal memuat data master ruangan & gedung');
      }
    }
    loadInitialDataset();
  }, []);

  useEffect(() => {
    if (activeTab === 'weekly' && weeklyDates.length > 0) {
      const datesToFetch = [...weeklyDates];
      
      const fetchWeekly = async () => {
        setLoadingWeekly(true);
        const map: { [dateStr: string]: Ruang[] } = {};
        
        try {
          await Promise.all(
            datesToFetch.map(async (d) => {
              try {
                const queryParams = new URLSearchParams({
                  tanggal: d,
                  waktuMulai: filters.waktuMulai,
                  waktuSelesai: filters.waktuSelesai,
                  kapasitas: filters.kapasitas,
                  gedungId: filters.gedungId,
                }).toString();
                const res = await api.get(`/ruang/available?${queryParams}`);
                map[d] = Array.isArray(res) ? res : [];
              } catch (e) {
                map[d] = [];
              }
            })
          );
          setWeeklyAvailability(map);
        } catch (error) {
          toast.error('Gagal mengambil data ketersediaan sepekan');
        } finally {
          setLoadingWeekly(false);
        }
      };
      
      fetchWeekly();
    }
  }, [activeTab, weeklyDates, filters.waktuMulai, filters.waktuSelesai, filters.kapasitas, filters.gedungId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!filters.tanggal || !filters.waktuMulai || !filters.waktuSelesai) {
      toast.error('Mohon tentukan tanggal, waktu mulai, dan waktu selesai!');
      return;
    }

    if (filters.tanggal < todayStr) {
      toast.error('Anda tidak dapat memesan ruangan di tanggal yang sudah berlalu.');
      return;
    }

    const currentTimeStr = getCurrentTimeStr();
    if (filters.tanggal === todayStr && filters.waktuMulai < currentTimeStr) {
      toast.error(`Jam mulai (${filters.waktuMulai}) sudah terlewat untuk hari ini.`);
      setRuangList([]); 
      setHasSearched(true);
      return;
    }

    if (filters.waktuMulai >= filters.waktuSelesai) {
      toast.error('Jam selesai harus lebih lambat dari jam mulai peminjaman.');
      return;
    }

    setLoading(true);
    setAlternatif(null);
    try {
      const queryParams = new URLSearchParams({
        tanggal: filters.tanggal,
        waktuMulai: filters.waktuMulai,
        waktuSelesai: filters.waktuSelesai,
        kapasitas: filters.kapasitas,
        gedungId: filters.gedungId,
      }).toString();

      const res = await api.get(`/ruang/available?${queryParams}`);
      setRuangList(Array.isArray(res) ? res : []);
      setHasSearched(true);
      if (Array.isArray(res) && res.length > 0) {
        toast.success(`${res.length} ruangan tersedia ditemukan!`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal mencari ketersediaan ruangan');
    } finally {
      setLoading(false);
    }
  };

  const executePinjam = async (ruangId: number, asAlternative = false) => {
    if (user?.role === 'GUEST') {
      toast.error('Sesi Anda Guest. Silakan login dengan akun UNIMUS.');
      return;
    }

    if (filters.tanggal < todayStr) {
      toast.error('Anda mencoba memesan ruangan untuk tanggal yang sudah lewat.');
      return;
    }

    if (filters.tanggal === todayStr && filters.waktuMulai < getCurrentTimeStr()) {
      toast.error(`Jam mulai (${filters.waktuMulai}) sudah terlewat.`);
      return;
    }

    if (filters.waktuMulai >= filters.waktuSelesai) {
      toast.error('Waktu selesai tidak boleh mendahului waktu mulai.');
      return;
    }

    if (!keperluan.trim()) {
      toast('Mohon isi detail keperluan acara Anda terlebih dahulu!', { icon: '✍️' });
      const textElement = document.getElementById("input-purpose");
      if (textElement) {
        textElement.focus();
        textElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    try {
      await api.post('/booking', {
        ruangId,
        tanggal: filters.tanggal,
        waktuMulai: filters.waktuMulai,
        waktuSelesai: filters.waktuSelesai,
        keperluan: keperluan.trim(),
      });

      toast.success(asAlternative
        ? 'Reservasi alternatif berhasil diajukan! Menunggu Verifikasi.'
        : 'Pengajuan berhasil dikirim! Pantau status di halaman Riwayat.', { duration: 4000 });
      
      setKeperluan('');
      setAlternatif(null);
      
      const queryParams = new URLSearchParams({
        tanggal: filters.tanggal,
        waktuMulai: filters.waktuMulai,
        waktuSelesai: filters.waktuSelesai,
        kapasitas: filters.kapasitas,
        gedungId: filters.gedungId,
      }).toString();
      
      const refetched = await api.get(`/ruang/available?${queryParams}`);
      setRuangList(Array.isArray(refetched) ? refetched : []);
    } catch (err: any) {
      const errPayload = err.response?.data || err;
      if (errPayload.alternatif) {
        setAlternatif(errPayload.alternatif);
        toast.error(errPayload.error || 'Maaf, bentrok jadwal terdeteksi.');
      } else {
        toast.error(errPayload.error || 'Gagal mengajukan peminjaman ruangan.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWeeklyCell = (dateStr: string, ruang: Ruang) => {
    if (dateStr < todayStr) {
       toast.error('Tidak dapat memilih tanggal di masa lalu.');
       return;
    }
    if (dateStr === todayStr && filters.waktuMulai < getCurrentTimeStr()) {
      toast.error('Tidak dapat memilih jadwal ini karena jam peminjaman terlewat.');
      return;
    }

    setFilters(prev => ({ ...prev, tanggal: dateStr }));
    toast.success(`Ruang [${ruang.kode}] terpilih! Ketik detail Keperluan.`);

    setTimeout(() => {
      const element = document.getElementById("input-purpose-container");
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const txtArea = document.getElementById("input-purpose");
      if (txtArea) txtArea.focus();
    }, 150);

    setActiveTab('list');
  };

  useEffect(() => {
    setLimitAvailable(6);
    setLimitWeekly(6);
  }, [searchQuery, selectedLantai, selectedJenis, onlyLargeCapacity, filters]);

  const safeAllRuangs = Array.isArray(allRuangs) ? allRuangs : [];
  const uniqueJenis = Array.from(new Set(safeAllRuangs.map(r => r?.jenis).filter(Boolean))) as string[];
  const uniqueLantai = (Array.from(new Set(safeAllRuangs.map(r => String(r?.lantai)).filter(Boolean))) as string[]).sort((a: string, b: string) => parseInt(a) - parseInt(b));

  const safeRuangList = Array.isArray(ruangList) ? ruangList : [];
  const filteredAvailableList = safeRuangList.filter(ruang => {
    if (!ruang) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const codeMatch = ruang.kode?.toLowerCase().includes(q) || false;
      const nameMatch = ruang.nama?.toLowerCase().includes(q) || false;
      const jenisMatch = ruang.jenis?.toLowerCase().includes(q) || false;
      const facilitiesMatch = ruang.fasilitas?.toLowerCase().includes(q) || false;
      const buildingName = ruang?.gedung?.nama?.toLowerCase() || '';
      if (!codeMatch && !nameMatch && !jenisMatch && !facilitiesMatch && !buildingName.includes(q)) return false;
    }
    if (selectedLantai && String(ruang.lantai) !== selectedLantai) return false;
    if (selectedJenis && ruang.jenis !== selectedJenis) return false;
    if (onlyLargeCapacity && (ruang.kapasitas || 0) < 30) return false;
    return true;
  });

  const filteredWeeklyRows = safeAllRuangs.filter(ruang => {
    if (!ruang) return false;
    if (filters.gedungId && String(ruang.gedungId) !== filters.gedungId) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const codeMatch = ruang.kode?.toLowerCase().includes(q) || false;
      const nameMatch = ruang.nama?.toLowerCase().includes(q) || false;
      const jenisMatch = ruang.jenis?.toLowerCase().includes(q) || false;
      const facilitiesMatch = ruang.fasilitas?.toLowerCase().includes(q) || false;
      const buildingName = safeAllRuangs.find(r => r?.id === ruang.id)?.gedung?.nama?.toLowerCase() || '';
      if (!codeMatch && !nameMatch && !jenisMatch && !facilitiesMatch && !buildingName.includes(q)) return false;
    }
    if (selectedLantai && String(ruang.lantai) !== selectedLantai) return false;
    if (selectedJenis && ruang.jenis !== selectedJenis) return false;
    if (onlyLargeCapacity && (ruang.kapasitas || 0) < 30) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-1 animate-fade-in" id="cari-ruang-page">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white border border-slate-200/60 rounded-3xl p-5 shadow-[0_4px_30px_rgba(0,0,0,0.015)]">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 mb-0.5">
            <Sparkles className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest font-mono">Real-time Scheduler Engine</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight font-sans">Cari & Cek Ketersediaan Ruangan</h2>
          <p className="text-xs text-slate-500 font-medium font-sans">Mencakup ketersediaan harian dan ketersediaan sepekan terintegrasi.</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl w-full lg:w-auto border border-slate-200/30">
          <button onClick={() => setActiveTab('list')} className={`flex-1 lg:flex-none px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none ${activeTab === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
            <Layers className="w-3.5 h-3.5" /> Pencarian & Booking
          </button>
          <button onClick={() => setActiveTab('weekly')} className={`flex-1 lg:flex-none px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer relative border-none ${activeTab === 'weekly' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
            <CalendarDays className="w-3.5 h-3.5 text-emerald-500" /> Ketersediaan Sepekan
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-3xl shadow-[0_4px_30px_rgba(0,0,0,0.015)] overflow-hidden" id="filters-card">
        <div className="p-4 md:p-5 border-b border-slate-100">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-3 font-mono">⚙️ LANGKAH 1: ATUR JADWAL PENGAJUAN</span>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              <div className="space-y-1.5 lg:col-span-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Tanggal Pemakaian
                </label>
                <input type="date" min={todayStr} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 font-semibold" value={filters.tanggal} onChange={e => setFilters({ ...filters, tanggal: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:col-span-2 lg:col-span-4 lg:grid-cols-2 lg:contents">
                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> Mulai Jam
                  </label>
                  <input type="time" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 font-semibold" value={filters.waktuMulai} onChange={e => setFilters({ ...filters, waktuMulai: e.target.value })} required />
                </div>
                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" /> Selesai Jam
                  </label>
                  <input type="time" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 font-semibold" value={filters.waktuSelesai} onChange={e => setFilters({ ...filters, waktuSelesai: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-1.5 sm:col-span-1 lg:col-span-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                  <School className="w-3.5 h-3.5 text-indigo-500" /> Target Gedung
                </label>
                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 font-semibold cursor-pointer" value={filters.gedungId} onChange={e => setFilters({ ...filters, gedungId: e.target.value })}>
                  <option value="">Semua Gedung Kampus</option>
                  {gedungs.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
                </select>
              </div>
              <div className="flex items-end sm:col-span-1 lg:col-span-2">
                <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 h-11 cursor-pointer border-none">
                  <Search className="w-3.5 h-3.5" /> Cari
                </button>
              </div>
            </div>
          </form>
        </div>

        <div className="bg-slate-50/60 p-4 space-y-3 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 font-mono">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" /> Saring Hasil Instan (Tanpa Reload)
            </span>
            {(searchQuery || selectedLantai || selectedJenis || onlyLargeCapacity) && (
              <button onClick={() => { setSearchQuery(''); setSelectedLantai(''); setSelectedJenis(''); setOnlyLargeCapacity(false); }} className="text-[10px] text-rose-600 font-bold flex items-center gap-1 cursor-pointer border-none bg-transparent">
                <X className="w-3 h-3" /> Bersihkan
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
            <div className="lg:col-span-4 relative">
              <input type="text" placeholder="Cari kelas, jenis, fasilitas..." className="w-full pl-9 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <div className="lg:col-span-8 flex flex-col sm:flex-row gap-3 sm:items-center overflow-hidden">
              <div className="overflow-x-auto scrollbar-none pb-0.5 flex-1 shrink-0">
                <div className="flex bg-slate-100 p-1 rounded-xl text-[10.5px] font-semibold text-slate-600 min-w-max items-center">
                  <span className="px-2 text-slate-400 font-black text-[9px] uppercase font-mono">Lantai</span>
                  <button onClick={() => setSelectedLantai('')} className={`px-2.5 py-1.5 rounded-lg font-bold border-none cursor-pointer ${selectedLantai === '' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'}`}>Semua</button>
                  {uniqueLantai.map(fl => <button key={fl} onClick={() => setSelectedLantai(fl)} className={`px-2.5 py-1.5 rounded-lg font-bold border-none cursor-pointer ${selectedLantai === fl ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'}`}>Lt {fl}</button>)}
                </div>
              </div>
              <div className="overflow-x-auto scrollbar-none pb-0.5 flex-1 shrink-0">
                <div className="flex bg-slate-100 p-1 rounded-xl text-[10.5px] font-semibold text-slate-600 min-w-max items-center">
                  <span className="px-2 text-slate-400 font-black text-[9px] uppercase font-mono">Tipe</span>
                  <button onClick={() => setSelectedJenis('')} className={`px-2.5 py-1.5 rounded-lg font-bold border-none cursor-pointer ${selectedJenis === '' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'}`}>Semua</button>
                  {uniqueJenis.map(t => <button key={t} onClick={() => setSelectedJenis(t)} className={`px-2.5 py-1.5 rounded-lg font-bold border-none cursor-pointer ${selectedJenis === t ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'}`}>{t}</button>)}
                </div>
              </div>
              <button onClick={() => setOnlyLargeCapacity(!onlyLargeCapacity)} className={`py-2 px-3.5 rounded-xl border text-[10.5px] font-extrabold flex items-center gap-1.5 cursor-pointer whitespace-nowrap border-none ${onlyLargeCapacity ? 'bg-amber-500 text-white' : 'bg-white text-slate-600'}`}>
                <Flame className={`w-3.5 h-3.5 ${onlyLargeCapacity ? 'text-white' : 'text-amber-500'}`} /> Kapasitas ≥ 30
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-emerald-100 rounded-3xl p-4 md:p-5 shadow-[0_4px_30px_rgba(0,0,0,0.01)]" id="input-purpose-container">
        <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 mb-2.5 font-mono">
          <BookmarkCheck className="w-4.5 h-4.5 text-emerald-600 animate-pulse shrink-0" /> Detail Peminjaman Ruang (Wajib Diisi)
        </label>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch lg:items-center font-sans">
          <div className="lg:col-span-9">
            <textarea placeholder="Tulis keperluan detil peminjaman ruang di sini..." className="w-full p-3.5 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-2xl text-xs font-semibold resize-none" rows={1} value={keperluan} onChange={e => setKeperluan(e.target.value)} id="input-purpose" />
          </div>
          <div className="lg:col-span-3 flex items-start gap-2.5 text-[10.5px] text-slate-500 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100/20">
            <Info className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="font-semibold text-slate-600">Ketik rincian keperluan terlebih dahulu, kemudian tekan tombol hijau <strong>Ajukan</strong>.</p>
          </div>
        </div>
      </div>

      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-slate-100/70 p-3 rounded-2xl border border-slate-200/50 gap-2">
            <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2 font-mono">
              <Layers className="w-4 h-4 text-indigo-600" /> HASIL PENCARIAN ({filteredAvailableList.length} Ruang Tersedia)
            </h3>
            <span className="text-[10.5px] text-indigo-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold shadow-xs text-center font-sans">
              🗓 {getFormatIndoDay(filters.tanggal)} • {filters.waktuMulai} - {filters.waktuSelesai}
            </span>
          </div>

          {loading ? (
            <div className="py-10">
              <LoadingSpinner text="Memindai ketersediaan ruang..." />
            </div>
          ) : hasSearched && filteredAvailableList.length === 0 ? (
            <EmptyState 
              icon={<AlertTriangle className="w-12 h-12 text-amber-500" />}
              title="Ruangan Penuh / Waktu Terlewat"
              description="Semua ruangan dengan kriteria yang Anda cari di jam ini sudah terisi, atau waktu peminjaman sudah terlewat. Silakan geser jam atau pilih tanggal lain."
            />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAvailableList.slice(0, limitAvailable).map(ruang => (
                  <div key={ruang.id} className="bg-white border border-slate-200/60 hover:border-indigo-200 rounded-3xl shadow-[0_4px_25px_rgba(0,0,0,0.01)] hover:shadow-md transition-all p-5 flex flex-col justify-between group">
                    <div className="space-y-3.5">
                      <div className="flex justify-between items-start gap-2 font-sans">
                        <span className="inline-block py-1 px-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 font-bold font-mono text-[9px] rounded-lg border border-indigo-100 uppercase tracking-wider">{ruang.kode}</span>
                        <span className="text-[9.5px] text-indigo-600 font-extrabold bg-indigo-50/70 border border-indigo-100/30 px-2.5 py-1 rounded-full uppercase">Lantai {ruang.lantai}</span>
                      </div>
                      <div className="font-sans">
                        <h4 className="font-extrabold text-slate-900 leading-tight text-base group-hover:text-indigo-600 transition-colors">{ruang.nama}</h4>
                        <p className="text-xs text-slate-400 font-bold mt-0.5">{ruang.gedung?.nama || 'Gedung UNIMUS'}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 py-2.5 px-3 font-bold bg-slate-50 rounded-2xl border border-slate-100 font-sans">
                        <Armchair className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>Kapasitas <strong>{ruang.kapasitas} org</strong> <span className="text-slate-400 font-medium">({ruang.jenis})</span></span>
                      </div>
                    </div>
                    <div className="pt-4 mt-4 border-t border-slate-100">
                      <button onClick={() => executePinjam(ruang.id)} className={`w-full py-3 px-4 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs border-none ${user?.role === 'GUEST' ? 'bg-slate-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}>
                        {user?.role === 'GUEST' ? 'Login Sesi Reservasi' : 'Ajukan Reservasi Ruang'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {filteredAvailableList.length > limitAvailable && (
                <div className="flex justify-center pt-2">
                  <button onClick={() => setLimitAvailable(prev => prev + 6)} className="px-5 py-3 bg-indigo-50 text-indigo-700 font-extrabold text-xs rounded-xl cursor-pointer border-none">Tampilkan Lebih Banyak</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'weekly' && (
        <div className="space-y-4">
          {/* Bagian Weekly tidak banyak diubah karena bentuk tabel kompleks, hanya perbaikan UI loading */}
          {loadingWeekly ? (
            <div className="py-10 bg-white rounded-3xl border border-slate-200">
              <LoadingSpinner text="Memuat ketersediaan sepekan..." />
            </div>
          ) : filteredWeeklyRows.length === 0 ? (
            <EmptyState icon={<Search className="w-10 h-10 text-slate-300"/>} title="Tidak Ditemukan" description="Tidak ada ruangan yang cocok dengan kriteria filter." />
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-slate-600 text-xs font-black uppercase tracking-wider border-b border-slate-100">
                      <th className="p-4 min-w-[210px] sticky left-0 bg-slate-50/90 backdrop-blur z-10 border-r border-slate-200">Ruangan Kampus</th>
                      {weeklyDates.map((dateStr, i) => (
                        <th key={dateStr} className="p-4 text-center min-w-[130px] border-r border-slate-100">
                          <span className="block text-[11px] font-black text-slate-800">{getFormatIndoDay(dateStr)}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {filteredWeeklyRows.slice(0, limitWeekly).map(ruang => (
                      <tr key={ruang.id} className="hover:bg-slate-50/40">
                        <td className="p-4 bg-white sticky left-0 z-10 font-bold border-r border-slate-200">
                          <span className="block text-[9px] text-indigo-700 font-mono">{ruang.kode}</span>
                          <span className="block font-black text-slate-900">{ruang.nama.split(' - ')[1] || ruang.nama}</span>
                        </td>
                        {weeklyDates.map(dateStr => {
                          const isAvailableFromBackend = Array.isArray(weeklyAvailability[dateStr]) && weeklyAvailability[dateStr].some(r => r.id === ruang.id);
                          const isPastTimeToday = dateStr === todayStr && filters.waktuMulai < getCurrentTimeStr();
                          const isTrulyAvailable = isAvailableFromBackend && !isPastTimeToday;
                          return (
                            <td key={dateStr} className="p-3 text-center border-r border-slate-100 align-middle">
                              {isTrulyAvailable ? (
                                <button onClick={() => handleSelectWeeklyCell(dateStr, ruang)} className="w-full py-2 px-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/65 rounded-xl font-black text-[10px] cursor-pointer flex flex-col items-center gap-1">
                                  <span className="p-0.5 bg-emerald-500 rounded-full text-white"><Check className="w-2.5 h-2.5 stroke-[3]" /></span> Tersedia
                                </button>
                              ) : isPastTimeToday ? (
                                <div className="py-2.5 px-1.5 bg-slate-100/80 text-slate-400 rounded-xl font-bold text-[10px] flex flex-col items-center gap-1"><History className="w-2.5 h-2.5" /> Lewat</div>
                              ) : (
                                <div className="py-2.5 px-1.5 bg-rose-50/50 text-rose-800/80 rounded-xl font-bold text-[10px] flex flex-col items-center gap-1"><X className="w-2.5 h-2.5" /> Terpakai</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {alternatif && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="p-5 bg-amber-500 text-white flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
              <div><h4 className="font-extrabold text-sm">Bentrok Jadwal Terdeteksi</h4></div>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-slate-600 text-xs font-semibold">SIPRUS merekomendasikan ruangan kosong alternatif di gedung yang sama:</div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex justify-between items-center"><span className="font-mono text-xs font-bold text-indigo-700">{alternatif.kode}</span></div>
                <div><h5 className="font-black text-slate-900 text-sm mt-1">{alternatif.nama}</h5></div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button onClick={() => setAlternatif(null)} className="py-2.5 px-4 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-xl flex-1 cursor-pointer">Batal</button>
              <button onClick={() => executePinjam(alternatif.id, true)} className="py-2.5 px-4 bg-amber-500 text-white font-bold text-xs rounded-xl flex-1 cursor-pointer border-none">Ganti ke Alternatif</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}