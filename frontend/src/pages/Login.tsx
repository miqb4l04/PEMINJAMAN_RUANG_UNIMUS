import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { KeyRound, Mail, School, ShieldAlert, ArrowRight, UserCircle2, MonitorPlay } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginAsGuest, loading: authLoading } = useAuth(); // Tambahkan loginAsGuest

  // Perbaiki handler demo fill - gunakan password yang benar
  const handleDemoFill = (selectedEmail: string, selectedPassword: string) => {
    setEmail(selectedEmail);
    setPassword(selectedPassword);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi input
    if (!email.trim()) {
      setError('Email harus diisi.');
      return;
    }
    if (!password.trim()) {
      setError('Password harus diisi.');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Login berhasil, redirect ke dashboard
      window.location.href = '/';
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login gagal. Email atau password tidak sesuai.');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk guest mode - memanggil API Backend Guest
  const handleGuestMode = async () => {
    try {
      await loginAsGuest();
      window.location.href = '/';
    } catch (err: any) {
      setError('Terjadi kesalahan saat masuk sebagai tamu.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row" id="login-container">
      {/* Visual Identity Side (Gede Desktop, hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-700 to-indigo-900 text-white p-12 flex-col justify-between" id="login-branding">
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
            <School className="w-8 h-8 text-yellow-300" />
          </div>
          <span className="font-sans text-2xl font-black tracking-tight uppercase">UniRoom UNIMUS</span>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-6"
        >
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Sistem Digitalisasi<br />
            <span className="text-yellow-300">Peminjaman Ruangan</span> Kampus
          </h1>
          <p className="text-slate-200 text-base leading-relaxed max-w-md">
            Memudahkan civitas akademika Universitas Muhammadiyah Semarang melakukan pelacakan ketersediaan, reservasi, dan validasi ruangan kelas terintegrasi secara dinamis.
          </p>
        </motion.div>

        <div className="text-xs text-indigo-200 font-mono">
          Siprus Version v2.6 • Universitas Muhammadiyah Semarang
        </div>
      </div>

      {/* Login Form Side */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-white" id="login-form-side">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md space-y-8"
        >
          <div className="md:hidden flex flex-col items-center text-center space-y-2 mb-4">
            <div className="p-3 bg-blue-600 rounded-2xl text-white">
              <School className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">UniRoom UNIMUS</h2>
            <p className="text-xs text-slate-500">Sistem Peminjaman Ruang Siprus</p>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 hidden md:block">Selamat Datang</h3>
            <p className="text-sm text-slate-500">Silakan login dengan akun UNIMUS Anda</p>
          </div>

          {error && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex gap-2.5 items-center" 
              id="login-error-alert"
            >
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Email UNIMUS</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="w-4.5 h-4.5" />
                </span>
                <input
                  type="email"
                  placeholder="name@unimus.ac.id"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  id="input-email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider font-sans">Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <KeyRound className="w-4.5 h-4.5" />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  id="input-password"
                />
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.985 }}
              type="submit"
              disabled={loading || authLoading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-indigo-200 hover:shadow-indigo-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
              id="btn-login-submit"
            >
              {loading || authLoading ? 'Menghubungkan...' : 'Masuk ke Aplikasi'}
              {!(loading || authLoading) && <ArrowRight className="w-4 h-4" />}
            </motion.button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-3 text-slate-400 text-[10px] font-bold tracking-widest uppercase font-sans">Atau</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <motion.button
              whileTap={{ scale: 0.985 }}
              type="button"
              onClick={handleGuestMode}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow"
              id="btn-guest-login"
            >
              Masuk Sesi Guest (Lihat Ketersediaan Ruang)
              <ArrowRight className="w-4 h-4 text-indigo-600" />
            </motion.button>
          </form>

          {/* DEMO ACCOUNTS QUICK-PICK */}
          <div className="pt-6 border-t border-slate-100" id="demo-accounts-panel">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 text-center md:text-left flex items-center justify-center md:justify-start gap-1.5">
              <MonitorPlay className="w-4 h-4 text-slate-500" />
              Klik Akun Demo untuk Uji Coba Cepat
            </h4>
            <div className="grid grid-cols-1 gap-2.5">
              {/* Akun Admin RT */}
              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={() => handleDemoFill('adminrt@unimus.ac.id', 'admin123')}
                className="p-3 text-left bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100/60 hover:border-indigo-200 rounded-xl transition-all flex items-center justify-between cursor-pointer group"
                id="demo-admin-rt"
              >
                <div>
                  <p className="text-xs font-bold text-indigo-900 group-hover:text-indigo-700">Admin Rumah Tangga (RT)</p>
                  <p className="text-[10px] text-indigo-600 font-mono mt-0.5">adminrt@unimus.ac.id</p>
                </div>
                <UserCircle2 className="w-5 h-5 text-indigo-500" />
              </motion.button>

              {/* Akun Kepala RT */}
              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={() => handleDemoFill('kepalart@unimus.ac.id', 'admin123')}
                className="p-3 text-left bg-purple-50/50 hover:bg-purple-50 border border-purple-100/60 hover:border-purple-200 rounded-xl transition-all flex items-center justify-between cursor-pointer group"
                id="demo-head-rt"
              >
                <div>
                  <p className="text-xs font-bold text-purple-900 group-hover:text-purple-700">Kepala RT</p>
                  <p className="text-[10px] text-purple-600 font-mono mt-0.5">kepalart@unimus.ac.id</p>
                </div>
                <UserCircle2 className="w-5 h-5 text-purple-500" />
              </motion.button>

              {/* Akun Mahasiswa */}
              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.99 }}
                type="button"
                onClick={() => handleDemoFill('mahasiswa@unimus.ac.id', 'admin123')}
                className="p-3 text-left bg-green-50/50 hover:bg-green-50 border border-green-100/60 hover:border-green-200 rounded-xl transition-all flex items-center justify-between cursor-pointer group"
                id="demo-student"
              >
                <div>
                  <p className="text-xs font-bold text-green-900 group-hover:text-green-700">Mahasiswa</p>
                  <p className="text-[10px] text-green-600 font-mono mt-0.5">mahasiswa@unimus.ac.id</p>
                </div>
                <UserCircle2 className="w-5 h-5 text-green-500" />
              </motion.button>
            </div>
            
            <p className="text-[10px] text-slate-400 mt-3 text-center">
              *Password untuk semua akun demo adalah: <span className="font-bold underline">admin123</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}