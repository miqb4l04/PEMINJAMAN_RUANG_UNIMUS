import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast'; // <--- IMPORT INI
import MainLayout from './layouts/MainLayout';
import LoadingSpinner from './components/LoadingSpinner'; // <--- IMPORT SPINNER

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CariRuang from './pages/CariRuang';
import Riwayat from './pages/Riwayat';
import ValidasiBooking from './pages/ValidasiBooking';
import MasterGedung from './pages/MasterGedung';
import MasterRuang from './pages/MasterRuang';
import Laporan from './pages/Laporan';
import Profil from './pages/Profil';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Menggunakan LoadingSpinner Premium yang baru kita buat
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <LoadingSpinner text="Memvalidasi Sesi Anda..." />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const safeRole = typeof user.role === 'string' ? user.role : '';
  const isAdmin = safeRole === 'ADMIN_RT' || safeRole === 'KEPALA_RT';

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <MainLayout activeTab={activeTab} onTabChange={handleTabChange}>
      {activeTab === 'dashboard' && <Dashboard onNavigateTo={handleTabChange} />}
      {activeTab === 'cari' && (safeRole === 'MAHASISWA' || safeRole === 'GUEST') && <CariRuang />}
      {activeTab === 'riwayat' && safeRole === 'MAHASISWA' && <Riwayat />}
      {activeTab === 'gedung' && safeRole === 'ADMIN_RT' && <MasterGedung />}
      {activeTab === 'ruang' && safeRole === 'ADMIN_RT' && <MasterRuang />}
      {activeTab === 'validasi' && isAdmin && <ValidasiBooking />}
      {activeTab === 'laporan' && isAdmin && <Laporan />}
      {activeTab === 'profil' && <Profil />}
    </MainLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      {/* MENGAKTIFKAN TOAST NOTIFICATION GLOBAL */}
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 3000,
          style: {
            background: '#334155',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 'bold',
            borderRadius: '12px'
          },
        }} 
      />
      <AppContent />
    </AuthProvider>
  );
}