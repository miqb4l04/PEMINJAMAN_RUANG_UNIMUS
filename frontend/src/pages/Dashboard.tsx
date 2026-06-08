import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { CalendarRange, ClipboardCheck, Clock, FileSpreadsheet, Plus, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast'; // <--- IMPORT TOAST

export default function Dashboard({
  onNavigateTo,
}: {
  onNavigateTo: (page: string) => void;
}) {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [popularRooms, setPopularRooms] = useState<any[]>([]);
  const [buildingCounts, setBuildingCounts] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const safeRole = (user?.role || '').toString().toUpperCase().trim();
  const isAdminOrKepala = safeRole === 'ADMIN_RT' || safeRole === 'KEPALA_RT';

  const fetchStats = async () => {
    try {
      setLoading(true);
      if (!user) return;
      if (safeRole === 'GUEST') {
        setStats({ total: 0, pending: 0, approved: 0, rejected: 0 });
        setLoading(false);
        return;
      }

      let allBookings: any[] = [];
      if (isAdminOrKepala) {
        allBookings = await api.get('/booking/all');
      } else {
        allBookings = await api.get('/booking/history');
      }

      if (!Array.isArray(allBookings)) allBookings = [];

      const total = allBookings.length;
      const pending = allBookings.filter((b: any) => (b.status || '').includes('MENUNGGU')).length;
      const approved = allBookings.filter((b: any) => b.status === 'DISETUJUI').length;
      const rejected = allBookings.filter((b: any) => (b.status || '').includes('DITOLAK')).length;

      setStats({ total, pending, approved, rejected });
      setRecentBookings(allBookings.slice(0, 4));

      const roomCounts: Record<number, { roomName: string; count: number; code: string }> = {};
      allBookings.forEach((b: any) => {
        if (b.ruang) {
          if (!roomCounts[b.ruangId]) roomCounts[b.ruangId] = { roomName: b.ruang.nama, code: b.ruang.kode, count: 0 };
          roomCounts[b.ruangId].count++;
        }
      });
      setPopularRooms(Object.values(roomCounts).sort((a, b) => b.count - a.count).slice(0, 4));

      const bldgCounts: Record<string, { name: string; count: number }> = {};
      allBookings.forEach((b: any) => {
        const buildName = b.ruang?.gedung?.nama || 'Gedung Lainnya';
        if (!bldgCounts[buildName]) bldgCounts[buildName] = { name: buildName, count: 0 };
        bldgCounts[buildName].count++;
      });
      setBuildingCounts(Object.values(bldgCounts));

    } catch (err: any) {
      if (!err.message?.includes('401')) {
        toast.error('Gagal mengambil data statistik dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  const currentHour = new Date().getHours();
  let greetingMsg = 'Selamat Pagi';
  if (currentHour >= 11 && currentHour < 15) greetingMsg = 'Selamat Siang';
  else if (currentHour >= 15 && currentHour < 19) greetingMsg = 'Selamat Sore';
  else if (currentHour >= 19 || currentHour < 5) greetingMsg = 'Selamat Malam';

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-800 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-y-1/3 translate-x-10 opacity-10">
          <CalendarRange className="w-96 h-96" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-block py-1 px-3 bg-white/10 rounded-full text-xs font-semibold backdrop-blur-md text-yellow-300 tracking-wider">
              {safeRole === 'MAHASISWA' ? 'MAHASISWA WORKSPACE' : safeRole === 'ADMIN_RT' ? 'ADMIN RT WORKSPACE' : 'GUEST WORKSPACE'}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              {greetingMsg}, {user?.name || 'Tamu'}!
            </h2>
            <p className="text-sm text-indigo-100 max-w-xl">
              {safeRole === 'MAHASISWA' || safeRole === 'GUEST'
                ? 'Selamat datang. Cari dan ajukan izin peminjaman ruangan perkuliahan secara instan di sini.'
                : 'Selamat datang. Silakan verifikasi, koreksi, dan koordinasikan jadwal peminjaman ruang.'}
            </p>
          </div>
          {(safeRole === 'MAHASISWA' || safeRole === 'GUEST') && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => onNavigateTo('cari')} className="py-3 px-5 bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-slate-900 font-bold text-sm rounded-xl cursor-pointer border-none flex items-center justify-center gap-2">
              <Plus className="w-4 h-4 text-slate-900" /> Pinjam Ruangan
            </motion.button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><FileSpreadsheet className="w-6 h-6" /></div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Peminjaman</span>
            {loading ? <span className="block h-7 w-12 bg-slate-100 animate-pulse rounded mt-1"></span> : <span className="text-3xl font-bold text-slate-800">{stats.total}</span>}
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Clock className="w-6 h-6 animate-spin-slow" /></div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Perlu Validasi</span>
            {loading ? <span className="block h-7 w-12 bg-slate-100 animate-pulse rounded mt-1"></span> : <span className={`text-3xl font-bold ${stats.pending > 0 ? 'text-amber-500' : 'text-slate-800'}`}>{stats.pending}</span>}
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><ClipboardCheck className="w-6 h-6" /></div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Izin Disetujui</span>
            {loading ? <span className="block h-7 w-12 bg-slate-100 animate-pulse rounded mt-1"></span> : <span className="text-3xl font-bold text-emerald-600">{stats.approved}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Metrik Booking per Gedung</h3>
          </div>
          {loading ? (
            <div className="h-44 flex items-center justify-center bg-slate-50 rounded-2xl"><div className="animate-pulse text-xs text-slate-400">Menghitung metrik...</div></div>
          ) : buildingCounts.length === 0 ? (
            <div className="h-44 flex items-center justify-center bg-slate-50 rounded-2xl text-xs text-slate-400">Belum ada riwayat booking.</div>
          ) : (
            <div className="space-y-3.5 pt-2">
              {buildingCounts.map((b, i) => {
                const maxCount = Math.max(...buildingCounts.map(bc => bc.count)) || 1;
                const pct = Math.round((b.count / maxCount) * 100);
                const colors = ['bg-indigo-600', 'bg-emerald-500', 'bg-amber-500'];
                const bColor = colors[i % colors.length];
                return (
                  <div key={b.name} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">{b.name}</span>
                      <span className="font-mono font-bold text-slate-900">{b.count} Reservasi</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className={`h-full ${bColor} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5"><Flame className="w-4 h-4 text-orange-500" /> Ruang Terpopuler</h3>
          </div>
          {loading ? (
            <div className="space-y-4"><div className="h-5 bg-slate-100 animate-pulse rounded"></div><div className="h-5 bg-slate-100 animate-pulse rounded"></div></div>
          ) : popularRooms.length === 0 ? (
            <div className="h-36 flex items-center justify-center bg-slate-50 rounded-2xl text-xs text-slate-400">Belum ada data.</div>
          ) : (
            <div className="space-y-3">
              {popularRooms.map((r, idx) => (
                <div key={r.code} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-700 font-mono font-bold text-[10px] flex items-center justify-center">{idx + 1}</span>
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">{r.code}</span>
                      <span className="text-[10px] text-slate-400 block">{r.roomName}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[9px] font-extrabold rounded-lg">{r.count}x</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}