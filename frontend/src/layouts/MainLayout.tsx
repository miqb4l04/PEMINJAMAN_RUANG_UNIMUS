import React, { useState, ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from '../components/NotificationBell';
import { 
  School, LogOut, Home, Search, ClipboardList, ShieldCheck, UserCircle2, 
  Building2, LayoutGrid, FileSpreadsheet, ChevronLeft, ChevronRight,
  BookOpen, Clock, ClipboardCheck, User, Lightbulb, X, BellRing
} from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function MainLayout({ children, activeTab, onTabChange }: MainLayoutProps) {
  const { user, logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideActiveTab, setGuideActiveTab] = useState<'alur' | 'aturan' | 'akun'>('alur');

  const safeRole = typeof user?.role === 'string' ? user.role : '';
  const isAdmin = safeRole === 'ADMIN_RT' || safeRole === 'KEPALA_RT';

  let displayRole = 'MEMUAT...';
  if (safeRole === 'GUEST') {
    displayRole = 'Sesi Tamu';
  } else if (safeRole !== '') {
    displayRole = safeRole.replace('_', ' ');
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans text-slate-800" id="applet-viewport">
      {/* DESKTOP SIDEBAR */}
      <aside 
        className={`hidden md:flex flex-col flex-shrink-0 z-30 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out relative ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`} 
      >
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute right-[-14px] top-[24px] bg-white border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 h-7 w-7 rounded-full flex items-center justify-center cursor-pointer shadow-sm z-40 transition-all hover:scale-105 active:scale-95"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4 text-indigo-600" /> : <ChevronLeft className="w-4 h-4 text-indigo-600" />}
        </button>

        <div className={`h-[76px] px-5 border-b border-slate-200 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-sm shadow-indigo-200 shrink-0">
            <School className="w-5 h-5" />
          </div>
          {!isSidebarCollapsed && (
            <div className="animate-fade-in truncate transition-all duration-300">
              <h1 className="font-extrabold text-sm tracking-tight text-slate-900 uppercase leading-tight">UniRoom</h1>
              <p className="text-[9px] text-slate-400 font-extrabold tracking-wider font-sans">SIPRUS UNIMUS v2.6</p>
            </div>
          )}
        </div>

        <div className={`p-4 border-b border-slate-100 flex items-center justify-between`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-1.5 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
              <UserCircle2 className="w-7 h-7" />
            </div>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden animate-fade-in transition-all duration-300">
                <span className="block font-bold text-xs truncate text-slate-800 leading-tight">{user?.name || 'Pengguna'}</span>
                <span className="block text-[8px] text-slate-500 truncate mt-0.5 uppercase tracking-wider font-extrabold font-sans">
                  {displayRole}
                </span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {/* Menu Items Dinamis Berdasarkan Role */}
          {[
            { id: 'dashboard', icon: Home, label: 'Beranda Dashboard', show: true },
            { id: 'cari', icon: Search, label: safeRole === 'GUEST' ? 'Cari Ketersediaan Ruang' : 'Cari & Pinjam Ruang', show: safeRole === 'MAHASISWA' || safeRole === 'GUEST' },
            { id: 'riwayat', icon: ClipboardList, label: 'Riwayat Peminjaman', show: safeRole === 'MAHASISWA' },
            { id: 'gedung', icon: Building2, label: 'Master Gedung', show: safeRole === 'ADMIN_RT' },
            { id: 'ruang', icon: LayoutGrid, label: 'Master Ruangan', show: safeRole === 'ADMIN_RT' },
            { id: 'validasi', icon: ShieldCheck, label: 'Validasi Berkas', show: isAdmin },
            { id: 'laporan', icon: FileSpreadsheet, label: 'Laporan Reservasi', show: isAdmin },
            { id: 'profil', icon: UserCircle2, label: 'Profil Akun', show: true },
          ].map((item) => item.show && (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full py-2.5 px-3 rounded-xl transition-all flex items-center cursor-pointer group relative ${
                isSidebarCollapsed ? 'justify-center' : 'gap-3 text-left'
              } ${
                activeTab === item.id
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10 font-bold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
              }`}
            >
              <item.icon className="w-4.5 h-4.5 shrink-0" />
              {!isSidebarCollapsed && <span className="text-xs transition-all duration-300">{item.label}</span>}
              {isSidebarCollapsed && (
                <span className="absolute left-16 bg-slate-900 text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-md font-bold font-sans">
                  {item.label}
                </span>
              )}
            </button>
          ))}

          {/* Tombol Panduan */}
          <button
            onClick={() => setIsGuideOpen(true)}
            className={`w-full py-2.5 px-3 rounded-xl border border-indigo-100/70 bg-indigo-50/25 text-indigo-600 hover:bg-indigo-50 transition-all flex items-center cursor-pointer group relative mt-4 ${
              isSidebarCollapsed ? 'justify-center' : 'gap-3 text-left'
            }`}
          >
            <BookOpen className="w-4.5 h-4.5 shrink-0 animate-pulse" />
            {!isSidebarCollapsed && <span className="text-xs font-bold leading-none transition-all duration-300">Panduan & Aturan</span>}
            {isSidebarCollapsed && (
              <span className="absolute left-16 bg-indigo-600 text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-md font-bold font-sans">
                Panduan & Aturan
              </span>
            )}
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={logout}
            className={`w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold flex items-center justify-center cursor-pointer transition-colors group relative ${
              isSidebarCollapsed
                ? 'px-0 bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 hover:text-rose-700'
                : 'px-3 bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0 animate-pulse-slow" />
            {!isSidebarCollapsed && <span className="ml-2 font-sans truncate transition-all duration-300">Keluar Sesi</span>}
            {isSidebarCollapsed && (
              <span className="absolute left-16 bg-rose-600 text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-md font-bold font-sans">
                Keluar Sesi (Logout)
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER BAR */}
      <header className="md:hidden bg-white text-slate-800 flex items-center justify-between p-4 sticky top-0 z-45 border-b border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-600 rounded-xl text-white shadow-sm shadow-indigo-100">
            <School className="w-4.5 h-4.5" />
          </div>
          <span className="font-black text-sm uppercase tracking-tight text-slate-900">UniRoom</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsGuideOpen(true)}
            className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl border border-indigo-100/60 transition-all text-xs cursor-pointer flex items-center justify-center"
            title="Lihat Panduan & Aturan"
          >
            <BookOpen className="w-4 h-4 animate-pulse" />
          </button>
          <NotificationBell />
          <button
            onClick={logout}
            className="p-2 bg-[#f8fafc] hover:bg-rose-50 border border-slate-100/80 rounded-xl text-slate-500 hover:text-rose-600 transition-all text-xs cursor-pointer"
            title="Keluar Sesi"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN VIEW AREA */}
      <div className="flex-grow flex flex-col min-w-0 z-10">
        
        {/* DESKTOP TOP HEADER BAR */}
        <header className="hidden md:flex bg-white/95 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200 h-[76px] px-8 justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight capitalize flex items-center gap-2">
              {activeTab === 'dashboard' ? 'Overview' : activeTab.replace('-', ' ')}
            </h2>
          </div>
          <div className="flex items-center gap-3 bg-white border border-slate-200 shadow-sm p-1 pl-4 rounded-full">
            <div className="flex items-center gap-2.5 mr-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{displayRole}</span>
            </div>
            <div className="h-5 w-px bg-slate-200"></div>
            <NotificationBell />
          </div>
        </header>

        {/* AREA KONTEN HALAMAN */}
        <main className="p-4 md:p-8 flex-grow pb-24 md:pb-8">
          {children}
        </main>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.04)] flex justify-around py-2.5 z-45">
          {[
            { id: 'dashboard', icon: Home, label: 'Beranda', show: true },
            { id: 'cari', icon: Search, label: 'Cari Ruang', show: safeRole === 'MAHASISWA' || safeRole === 'GUEST' },
            { id: 'riwayat', icon: ClipboardList, label: 'Riwayat', show: safeRole === 'MAHASISWA' },
            { id: 'gedung', icon: Building2, label: 'Gedung', show: safeRole === 'ADMIN_RT' },
            { id: 'ruang', icon: LayoutGrid, label: 'Ruang', show: safeRole === 'ADMIN_RT' },
            { id: 'validasi', icon: ShieldCheck, label: 'Validasi', show: isAdmin },
            { id: 'laporan', icon: FileSpreadsheet, label: 'Laporan', show: isAdmin },
            { id: 'profil', icon: UserCircle2, label: 'Profil', show: true },
          ].map((item) => item.show && (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1 flex-1 relative border-none bg-transparent cursor-pointer ${
                activeTab === item.id ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'
              }`}
            >
              <item.icon className="w-5.5 h-5.5" />
              <span className="text-[8px] tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* PERSISTENT GUIDE DRAWER (FULL KODE ASLI) */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] transition-opacity duration-300 ${
          isGuideOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
        }`}
        onClick={() => setIsGuideOpen(false)}
      />
      <div 
        className={`fixed right-0 top-0 bottom-0 w-full sm:max-w-md bg-white shadow-2xl z-[100] flex flex-col h-screen overflow-hidden border-l border-slate-200 transition-transform duration-300 ease-out ${
          isGuideOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Panduan & Regulasi Ruang</h3>
              <p className="text-[10px] text-slate-400">Aturan resmi SIPRUS UNIMUS real-time</p>
            </div>
          </div>
          <button
            onClick={() => setIsGuideOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors border-none bg-transparent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex bg-slate-50 border-b border-slate-200 p-2 gap-1.5 shrink-0">
          {[
            { id: 'alur', label: 'Alur Pinjam', icon: Clock },
            { id: 'aturan', label: 'Aturan', icon: ClipboardCheck },
            { id: 'akun', label: 'Sesi Akun', icon: User }
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = guideActiveTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setGuideActiveTab(tab.id as any)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                    : 'bg-white hover:bg-slate-100 text-slate-600'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 p-5 overflow-y-auto space-y-5">
          {guideActiveTab === 'alur' && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Prosedur peminjaman ruang di Universitas Muhammadiyah Semarang menggunakan skema **Otorisasi 2 Tingkat** agar tertib dan terjadwal secara presisi:
              </p>
              <div className="space-y-3.5 mt-2">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150/80 space-y-1 relative overflow-hidden">
                  <span className="absolute -right-2 -bottom-3 text-indigo-100/30 text-7xl font-sans font-black pointer-events-none select-none">1</span>
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-extrabold text-blue-700">1</span>
                    <h4 className="text-xs font-bold text-slate-850">Ajukan Pengajuan (Mahasiswa)</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                    Pilih ruangan kosong di tab <strong className="text-indigo-600">Cari Ruang</strong>, isi detail agenda kegiatan resmi, serta kirim permohonan.
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150/80 space-y-1 relative overflow-hidden">
                  <span className="absolute -right-2 -bottom-3 text-indigo-100/30 text-7xl font-sans font-black pointer-events-none select-none">2</span>
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-extrabold text-amber-700">2</span>
                    <h4 className="text-xs font-bold text-slate-850">Review & Verifikasi (Admin RT)</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                    Biro Admin Rumah Tangga memvalidasi kesesuaian berkas serta menyetujui kuintansi / pengalihan jadwal bebas konflik akademis.
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150/80 space-y-1 relative overflow-hidden">
                  <span className="absolute -right-2 -bottom-3 text-indigo-100/30 text-7xl font-sans font-black pointer-events-none select-none">3</span>
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-extrabold text-emerald-700">3</span>
                    <h4 className="text-xs font-bold text-slate-850">Persetujuan Kepala RT (Siprus)</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                    Kepala Bagian RT menerbitkan persetujuan resmi penuh, membuat ruangan status terbooking, serta mengirim notifikasi ke pemohon.
                  </p>
                </div>
              </div>
            </div>
          )}

          {guideActiveTab === 'aturan' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-amber-50/40 border border-amber-200/85 rounded-xl space-y-1.5">
                <h4 className="text-xs font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  Aturan Pengajuan H-1
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                  Semua permohonan peminjaman ruangan wajib diajukan maksimal 1 hari sebelum penyelenggaraan kegiatan resmi untuk kelancaran pemrosesan.
                </p>
              </div>
              <div className="p-4 bg-blue-50/30 border border-blue-200/55 rounded-xl space-y-1.5">
                <h4 className="text-xs font-extrabold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Batas Jam Layanan
                </h4>
                <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                  Sistem mencatat pemakaian hanya di jam operasional gedung (mulai 07:00 hingga maksimal 21:00 WIB). Penggunaan luar jam wajib ijin tertulis BAUK.
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-150/80 flex items-start gap-2 text-[11px] text-slate-600 leading-relaxed">
                <Lightbulb className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block mb-0.5">Ketentuan Kebersihan & Keamanan:</span>
                  Mahasiswa pemohon bertangung jawab menjaga kebersihan, mengembalikan tata letak kursi, mematikan AC / LCD proyektor sebelum mengunci pintu kembali.
                </div>
              </div>
            </div>
          )}

          {guideActiveTab === 'akun' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  Identitas Sesi Aktif
                </h4>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center py-1 text-[11px]">
                    <span className="text-slate-450 font-medium">Nama</span>
                    <span className="font-extrabold text-slate-800">{user?.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 text-[11px]">
                    <span className="text-slate-450 font-medium">Email</span>
                    <span className="font-semibold text-slate-700 font-mono">{user?.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 text-[11px]">
                    <span className="text-slate-450 font-medium">Otoritas</span>
                    <span className="inline-block py-0.5 px-2 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-[9px] font-bold font-mono uppercase">
                      {safeRole}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100/50 text-[10px] text-slate-650 leading-relaxed space-y-1 font-semibold">
                <p>
                  Sesi login Anda dilindungi enkripsi token digital UNIMUS. Segala perubahan data dan audit reservasi terekam real-time oleh server SIPRUS.
                </p>
                <p className="text-indigo-600 flex items-center gap-1 mt-2">
                  <BellRing className="w-3.5 h-3.5" />
                  <strong>Cek Lonceng:</strong> Pantau notifikasi peminjaman Anda di pojok kanan atas layar!
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={() => setIsGuideOpen(false)}
            className="px-4 py-2 bg-indigo-600 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-sm border-none"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
}