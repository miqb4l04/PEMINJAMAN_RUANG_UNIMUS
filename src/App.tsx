import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CariRuang from './pages/CariRuang';
import Riwayat from './pages/Riwayat';
import ValidasiBooking from './pages/ValidasiBooking';
import MasterGedung from './pages/MasterGedung';
import MasterRuang from './pages/MasterRuang';
import Laporan from './pages/Laporan';
import Profil from './pages/Profil';
import NotificationBell from './components/NotificationBell';
import { 
  School, LogOut, Home, Search, ClipboardList, ShieldCheck, UserCircle2, 
  ArrowUpRight, Building2, LayoutGrid, FileSpreadsheet, ChevronLeft, ChevronRight,
  BookOpen, Clock, ClipboardCheck, User, Lightbulb, X, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, cari, riwayat, gedung, ruang, validasi, laporan
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideActiveTab, setGuideActiveTab] = useState<'alur' | 'aturan' | 'akun'>('alur');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent mb-2"></div>
        <p className="text-gray-500 text-sm font-semibold tracking-wide font-sans animate-pulse">
          Memuat Web Prasarana UNIMUS...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Admin and Kepala RT are considered "Administrators"
  const isAdmin = user.role === 'ADMIN_RT' || user.role === 'KEPALA_RT';

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans text-slate-800" id="applet-viewport">
      {/* DESKTOP SIDEBAR (visible only on md screens and larger) */}
      <aside 
        className={`hidden md:flex flex-col flex-shrink-0 z-20 bg-white border-r border-slate-200/80 transition-all duration-300 ease-in-out relative ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`} 
        id="desktop-sidebar"
      >
        {/* Toggle Collapse Slider Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute right-[-14px] top-6 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-500 hover:text-slate-800 h-7 w-7 rounded-xl flex items-center justify-center cursor-pointer shadow-sm z-30 transition-all hover:scale-105 active:scale-95"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4 text-indigo-600" /> : <ChevronLeft className="w-4 h-4 text-indigo-600" />}
        </button>

        {/* Brand Banner */}
        <div className={`p-5 border-b border-slate-100 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-sm shadow-indigo-200 shrink-0">
            <School className="w-5 h-5" />
          </div>
          {!isSidebarCollapsed && (
            <div className="animate-fade-in truncate">
              <h1 className="font-extrabold text-sm tracking-tight text-slate-900 uppercase">UniRoom</h1>
              <p className="text-[9px] text-slate-400 font-extrabold tracking-wider font-sans">SIPRUS UNIMUS v2.6</p>
            </div>
          )}
        </div>

{/* User Card (DI SINI LONCENGNYA) */}
        <div className={`p-4 border-b border-slate-100 bg-[#f8fafc]/50 flex items-center justify-between`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-1.5 bg-indigo-50 rounded-xl text-indigo-600 shrink-0">
              <UserCircle2 className="w-7 h-7" />
            </div>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden animate-fade-in">
                <span className="block font-bold text-xs truncate text-slate-800 leading-tight">{user.name}</span>
                <span className="block text-[8px] text-slate-500 truncate mt-0.5 uppercase tracking-wider font-extrabold font-sans">
                  {user.role === 'GUEST' ? 'Sesi Tamu' : `${user.role.replace('_', ' ')}`}
                </span>
              </div>
            )}
          </div>
          <div className="shrink-0">
             <NotificationBell />
          </div>
        </div>


        {/* Sidebar Nav links */}
        <nav className="flex-1 p-3 space-y-1.5" id="sidebar-nav">
          {/* Beranda Dashboard */}
          <button
            onClick={() => handleTabChange('dashboard')}
            className={`w-full py-2.5 px-3 rounded-xl transition-all flex items-center cursor-pointer group relative ${
              isSidebarCollapsed ? 'justify-center' : 'gap-3 text-left'
            } ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10 font-bold'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
            }`}
          >
            <Home className="w-4.5 h-4.5 shrink-0" />
            {!isSidebarCollapsed && <span className="text-xs">Beranda Dashboard</span>}
            {isSidebarCollapsed && (
              <span className="absolute left-16 bg-slate-900 text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-md font-bold font-sans">
                Beranda Dashboard
              </span>
            )}
          </button>

          {/* Student & Guest navigation links */}
          {(user.role === 'MAHASISWA' || user.role === 'GUEST') && (
            <button
              onClick={() => handleTabChange('cari')}
              className={`w-full py-2.5 px-3 rounded-xl transition-all flex items-center cursor-pointer group relative ${
                isSidebarCollapsed ? 'justify-center' : 'gap-3 text-left'
              } ${
                activeTab === 'cari'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10 font-bold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
              }`}
            >
              <Search className="w-4.5 h-4.5 shrink-0" />
              {!isSidebarCollapsed && (
                <span className="text-xs truncate">
                  {user.role === 'GUEST' ? 'Cari Ketersediaan Ruang' : 'Cari & Pinjam Ruang'}
                </span>
              )}
              {isSidebarCollapsed && (
                <span className="absolute left-16 bg-slate-900 text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-md font-bold font-sans">
                  {user.role === 'GUEST' ? 'Cari Ketersediaan Ruang' : 'Cari & Pinjam Ruang'}
                </span>
              )}
            </button>
          )}

          {user.role === 'MAHASISWA' && (
            <button
              onClick={() => handleTabChange('riwayat')}
              className={`w-full py-2.5 px-3 rounded-xl transition-all flex items-center cursor-pointer group relative ${
                isSidebarCollapsed ? 'justify-center' : 'gap-3 text-left'
              } ${
                activeTab === 'riwayat'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10 font-bold'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
              }`}
            >
              <ClipboardList className="w-4.5 h-4.5 shrink-0" />
              {!isSidebarCollapsed && <span className="text-xs">Riwayat Peminjaman</span>}
              {isSidebarCollapsed && (
                <span className="absolute left-16 bg-slate-900 text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-md font-bold font-sans">
                  Riwayat Peminjaman
                </span>
              )}
            </button>
          )}

          {/* Admin RT only - Master Data */}
          {user.role === 'ADMIN_RT' && (
            <>
              <button
                onClick={() => handleTabChange('gedung')}
                className={`w-full py-2.5 px-3 rounded-xl transition-all flex items-center cursor-pointer group relative ${
                  isSidebarCollapsed ? 'justify-center' : 'gap-3 text-left'
                } ${
                  activeTab === 'gedung'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10 font-bold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                }`}
              >
                <Building2 className="w-4.5 h-4.5 shrink-0" />
                {!isSidebarCollapsed && <span className="text-xs">Master Gedung</span>}
                {isSidebarCollapsed && (
                  <span className="absolute left-16 bg-slate-900 text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-md font-bold font-sans">
                    Master Gedung
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabChange('ruang')}
                className={`w-full py-2.5 px-3 rounded-xl transition-all flex items-center cursor-pointer group relative ${
                  isSidebarCollapsed ? 'justify-center' : 'gap-3 text-left'
                } ${
                  activeTab === 'ruang'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10 font-bold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                }`}
              >
                <LayoutGrid className="w-4.5 h-4.5 shrink-0" />
                {!isSidebarCollapsed && <span className="text-xs">Master Ruangan</span>}
                {isSidebarCollapsed && (
                  <span className="absolute left-16 bg-slate-900 text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-md font-bold font-sans">
                    Master Ruangan
                  </span>
                )}
              </button>
            </>
          )}

          {/* Admin and Kepala RT validation link */}
          {isAdmin && (
            <>
              <button
                onClick={() => handleTabChange('validasi')}
                className={`w-full py-2.5 px-3 rounded-xl transition-all flex items-center cursor-pointer group relative ${
                  isSidebarCollapsed ? 'justify-center' : 'gap-3 text-left'
                } ${
                  activeTab === 'validasi'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10 font-bold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                }`}
              >
                <ShieldCheck className="w-4.5 h-4.5 shrink-0" />
                {!isSidebarCollapsed && <span className="text-xs">Validasi Berkas</span>}
                {isSidebarCollapsed && (
                  <span className="absolute left-16 bg-slate-900 text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-md font-bold font-sans">
                    Validasi Berkas
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabChange('laporan')}
                className={`w-full py-2.5 px-3 rounded-xl transition-all flex items-center cursor-pointer group relative ${
                  isSidebarCollapsed ? 'justify-center' : 'gap-3 text-left'
                } ${
                  activeTab === 'laporan'
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10 font-bold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                }`}
              >
                <FileSpreadsheet className="w-4.5 h-4.5 shrink-0" />
                {!isSidebarCollapsed && <span className="text-xs">Laporan Reservasi</span>}
                {isSidebarCollapsed && (
                  <span className="absolute left-16 bg-slate-900 text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-md font-bold font-sans">
                    Laporan Reservasi
                  </span>
                )}
              </button>
            </>
          )}

          {/* All Users Profile link */}
          <button
            onClick={() => handleTabChange('profil')}
            className={`w-full py-2.5 px-3 rounded-xl transition-all flex items-center cursor-pointer group relative ${
              isSidebarCollapsed ? 'justify-center' : 'gap-3 text-left'
            } ${
              activeTab === 'profil'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10 font-bold'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-semibold'
            }`}
          >
            <UserCircle2 className="w-4.5 h-4.5 shrink-0" />
            {!isSidebarCollapsed && <span className="text-xs">Profil Akun</span>}
            {isSidebarCollapsed && (
              <span className="absolute left-16 bg-slate-900 text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-md font-bold font-sans">
                Profil Akun
              </span>
            )}
          </button>

          {/* Persistent Bantuan & Regulasi Sidebar Toggler */}
          <button
            onClick={() => setIsGuideOpen(true)}
            className={`w-full py-2.5 px-3 rounded-xl border border-indigo-100/70 bg-indigo-50/25 text-indigo-600 hover:bg-indigo-50 transition-all flex items-center cursor-pointer group relative ${
              isSidebarCollapsed ? 'justify-center' : 'gap-3 text-left'
            }`}
          >
            <BookOpen className="w-4.5 h-4.5 shrink-0 animate-pulse" />
            {!isSidebarCollapsed && <span className="text-xs font-bold leading-none">Panduan & Aturan</span>}
            {isSidebarCollapsed && (
              <span className="absolute left-16 bg-indigo-600 text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-md font-bold font-sans">
                Panduan & Aturan
              </span>
            )}
          </button>
        </nav>

        {/* Desktop Logout Footer */}
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
            {!isSidebarCollapsed && <span className="ml-2 font-sans truncate">Keluar Sesi</span>}
            {isSidebarCollapsed && (
              <span className="absolute left-16 bg-rose-600 text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-md font-bold font-sans">
                Keluar Sesi (Logout)
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER BAR & BOTTOM NAV */}
      <header className="md:hidden bg-white text-slate-800 flex items-center justify-between p-4 sticky top-0 z-45 border-b border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)]" id="mobile-header">
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
      <div className="flex-grow flex flex-col min-w-0" id="applet-core-panel">
        <main className="p-4 md:p-8 flex-grow pb-24 md:pb-8">
          {activeTab === 'dashboard' && <Dashboard onNavigateTo={handleTabChange} />}
          {activeTab === 'cari' && (user.role === 'MAHASISWA' || user.role === 'GUEST') && <CariRuang />}
          {activeTab === 'riwayat' && user.role === 'MAHASISWA' && <Riwayat />}
          {activeTab === 'gedung' && user.role === 'ADMIN_RT' && <MasterGedung />}
          {activeTab === 'ruang' && user.role === 'ADMIN_RT' && <MasterRuang />}
          {activeTab === 'validasi' && isAdmin && <ValidasiBooking />}
          {activeTab === 'laporan' && isAdmin && <Laporan />}
          {activeTab === 'profil' && <Profil />}
        </main>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.04)] flex justify-around py-2.5 z-45" id="mobile-bottom-nav">
          {/* Home */}
          <button
            onClick={() => handleTabChange('dashboard')}
            className={`flex flex-col items-center gap-1 flex-1 relative border-none bg-transparent cursor-pointer ${
              activeTab === 'dashboard' ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'
            }`}
          >
            <Home className="w-5.5 h-5.5" />
            <span className="text-[8px] tracking-wide">Beranda</span>
          </button>

          {/* Student & Guest Mobile Tabs */}
          {(user.role === 'MAHASISWA' || user.role === 'GUEST') && (
            <button
              onClick={() => handleTabChange('cari')}
              className={`flex flex-col items-center gap-1 flex-1 relative border-none bg-transparent cursor-pointer ${
                activeTab === 'cari' ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'
              }`}
            >
              <Search className="w-5.5 h-5.5" />
              <span className="text-[8px] tracking-wide">Cari Ruang</span>
            </button>
          )}

          {user.role === 'MAHASISWA' && (
            <button
              onClick={() => handleTabChange('riwayat')}
              className={`flex flex-col items-center gap-1 flex-1 relative border-none bg-transparent cursor-pointer ${
                activeTab === 'riwayat' ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'
              }`}
            >
              <ClipboardList className="w-5.5 h-5.5" />
              <span className="text-[8px] tracking-wide">Riwayat</span>
            </button>
          )}

          {/* Admin RT Tabs */}
          {user.role === 'ADMIN_RT' && (
            <>
              <button
                onClick={() => handleTabChange('gedung')}
                className={`flex flex-col items-center gap-1 flex-1 relative border-none bg-transparent cursor-pointer ${
                  activeTab === 'gedung' ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'
                }`}
              >
                <Building2 className="w-5.5 h-5.5" />
                <span className="text-[8px] tracking-wide">Gedung</span>
              </button>

              <button
                onClick={() => handleTabChange('ruang')}
                className={`flex flex-col items-center gap-1 flex-1 relative border-none bg-transparent cursor-pointer ${
                  activeTab === 'ruang' ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'
                }`}
              >
                <LayoutGrid className="w-5.5 h-5.5" />
                <span className="text-[8px] tracking-wide">Ruang</span>
              </button>
            </>
          )}

          {/* Admin & Kepala RT Validasi/Laporan Tabs */}
          {isAdmin && (
            <>
              <button
                onClick={() => handleTabChange('validasi')}
                className={`flex flex-col items-center gap-1 flex-1 relative border-none bg-transparent cursor-pointer ${
                  activeTab === 'validasi' ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'
                }`}
              >
                <ShieldCheck className="w-5.5 h-5.5" />
                <span className="text-[8px] tracking-wide">Validasi</span>
              </button>

              <button
                onClick={() => handleTabChange('laporan')}
                className={`flex flex-col items-center gap-1 flex-1 relative border-none bg-transparent cursor-pointer ${
                  activeTab === 'laporan' ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'
                }`}
              >
                <FileSpreadsheet className="w-5.5 h-5.5" />
                <span className="text-[8px] tracking-wide">Laporan</span>
              </button>
            </>
          )}

          {/* Profil mobile option */}
          <button
            onClick={() => handleTabChange('profil')}
            className={`flex flex-col items-center gap-1 flex-1 relative border-none bg-transparent cursor-pointer ${
              activeTab === 'profil' ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'
            }`}
          >
            <UserCircle2 className="w-5.5 h-5.5" />
            <span className="text-[8px] tracking-wide">Profil</span>
          </button>
        </nav>
      </div>

      {/* PERSISTENT GUIDE DRAWER (SLIDES IN FROM THE RIGHT) */}
      <AnimatePresence>
        {isGuideOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ bgOpacity: 0, opacity: 0 }}
              animate={{ bgOpacity: 1, opacity: 1 }}
              exit={{ bgOpacity: 0, opacity: 0 }}
              onClick={() => setIsGuideOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 cursor-pointer"
            />

            {/* Sliding Drawer Body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              className="fixed right-0 top-0 bottom-0 w-full sm:max-w-md bg-white shadow-2xl z-[100] flex flex-col h-screen overflow-hidden border-l border-slate-200"
            >
              {/* Header */}
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
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sub tabs inside drawer */}
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

              {/* Scrollable Content */}
              <div className="flex-1 p-5 overflow-y-auto space-y-5">
                {guideActiveTab === 'alur' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
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
                  </motion.div>
                )}

                {guideActiveTab === 'aturan' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
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
                  </motion.div>
                )}

                {guideActiveTab === 'akun' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
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
                            {user?.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100/50 text-[10px] text-slate-650 leading-relaxed space-y-1 font-semibold">
                      <p>
                        Sesi login Anda dilindungi enkripsi token digital UNIMUS. Segala perubahan data dan audit reservasi terekam real-time oleh server SIPRUS.
                      </p>
                      <p className="text-indigo-600">
                        💡 <strong>Tips:</strong> Klik ikon Lonceng di pojok kanan atas sistem untuk memantau alert notifikasi persetujuan secara live.
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
                <button
                  onClick={() => setIsGuideOpen(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-sm"
                >
                  Tutup Panduan
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
