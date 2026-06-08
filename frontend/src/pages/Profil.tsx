import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
// @ts-ignore
import { api } from '../services/api';
import { 
  User, Mail, Shield, LogOut, Check, AlertCircle, RefreshCw, Key, Info, Lock, Eye, EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Profil() {
  const { user, logout } = useAuth();
  
  // State untuk Profil
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [msgProfile, setMsgProfile] = useState({ type: '', text: '' });

  // State untuk Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [msgPassword, setMsgPassword] = useState({ type: '', text: '' });

  if (!user) return null;
  const isGuest = user.role === 'GUEST';

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setMsgProfile({ type: 'error', text: 'Nama dan Email tidak boleh kosong.' });
      return;
    }

    setLoadingProfile(true);
    setMsgProfile({ type: '', text: '' });
    try {
      await api.put('/auth/profile', { name: name.trim(), email: email.trim() });
      setMsgProfile({ type: 'success', text: 'Profil berhasil diperbarui! Perubahan nama akan terlihat setelah Anda login ulang.' });
    } catch (err: any) {
      setMsgProfile({ type: 'error', text: err.message || 'Gagal memperbarui profil.' });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMsgPassword({ type: 'error', text: 'Konfirmasi password baru tidak cocok!' });
      return;
    }
    if (newPassword.length < 6) {
      setMsgPassword({ type: 'error', text: 'Password baru minimal 6 karakter.' });
      return;
    }

    setLoadingPassword(true);
    setMsgPassword({ type: '', text: '' });
    try {
      await api.put('/auth/password', { oldPassword, newPassword });
      setMsgPassword({ type: 'success', text: 'Password berhasil diubah! Silakan gunakan password baru pada login berikutnya.' });
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      setMsgPassword({ type: 'error', text: err.message || 'Gagal mengubah password. Pastikan password lama benar.' });
    } finally {
      setLoadingPassword(false);
    }
  };

  const getInitials = (fullName: string) => {
    return fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="max-w-5xl mx-auto space-y-6 pb-10" 
    >
      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <User className="w-6 h-6 text-indigo-500" /> Pengaturan Akun
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Kelola data personal, kredensial sandi, dan previlese sistem prasarana Anda.
          </p>
        </div>
        <button
          onClick={logout}
          className="py-2.5 px-5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm border border-rose-200"
        >
          <LogOut className="w-4 h-4" /> Keluar Sesi
        </button>
      </div>

      {/* GRID LAYOUT UTAMA */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* KARTU PROFIL KIRI (AVATAR) */}
        <div className="md:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-5">
          <div className="relative group">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center font-black text-2xl tracking-wider shadow-inner transition-transform duration-300 select-none ${
              isGuest ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}>
              {getInitials(user.name)}
            </div>
            <span className="absolute bottom-1 right-2 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full" title="Online" />
          </div>

          <div className="space-y-1 w-full">
            <h3 className="font-bold text-slate-800 text-lg truncate px-2">{user.name}</h3>
            <p className="text-xs text-slate-500 font-mono truncate px-2">{user.email}</p>
          </div>

          <div className="w-full">
            <span className={`inline-flex px-3.5 py-1.5 items-center gap-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
              user.role === 'ADMIN_RT' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              user.role === 'KEPALA_RT' ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' :
              user.role === 'MAHASISWA' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
              'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              {isGuest ? '🛡️ TAMU / GUEST' : `👥 ${user.role.replace('_', ' ')}`}
            </span>
          </div>

          <div className="w-full bg-slate-50 rounded-xl p-4 text-xs space-y-3 text-slate-600 border border-slate-100">
            <div className="flex justify-between items-center">
              <span className="font-medium">Sistem ID</span>
              <span className="font-mono font-bold">#{user.id}</span>
            </div>
            <div className="border-b border-slate-200/60"></div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Status Verifikasi</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1"><Check className="w-3 h-3"/> Terverifikasi</span>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: FORM EDIT */}
        <div className="md:col-span-8 space-y-6">
          
          {isGuest ? (
            /* VIEW KHUSUS GUEST */
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900 mb-1">Sesi Tamu Terdeteksi</h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Anda saat ini melihat sistem menggunakan mode tamu. Anda diproteksi dari memodifikasi data dan hanya diperkenankan mencari status ketersediaan ruang.
                  </p>
                </div>
              </div>
              <button onClick={logout} className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm">
                <Key className="w-4 h-4" /> Masuk dengan Akun Resmi
              </button>
            </div>
          ) : (
            <>
              {/* FORM 1: UBAH PROFIL */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                  <User className="w-4 h-4 text-indigo-600" /> Informasi Pribadi
                </h4>

                {msgProfile.text && (
                  <div className={`p-4 mb-6 rounded-xl text-xs flex gap-3 items-center border font-medium ${msgProfile.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                    {msgProfile.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    {msgProfile.text}
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 flex items-center gap-2"><User className="w-3.5 h-3.5"/> Nama Lengkap</label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 flex items-center gap-2"><Mail className="w-3.5 h-3.5"/> Email Pengguna</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={loadingProfile} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50">
                      {loadingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Simpan Profil
                    </button>
                  </div>
                </form>
              </div>

              {/* FORM 2: UBAH PASSWORD */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                  <Shield className="w-4 h-4 text-indigo-600" /> Keamanan Sandi
                </h4>

                {msgPassword.text && (
                  <div className={`p-4 mb-6 rounded-xl text-xs flex gap-3 items-center border font-medium ${msgPassword.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                    {msgPassword.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    {msgPassword.text}
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 flex items-center gap-2"><Lock className="w-3.5 h-3.5"/> Password Saat Ini</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required placeholder="Masukkan sandi Anda saat ini" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pr-10" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">Password Baru</label>
                      <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="Minimal 6 karakter" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600">Konfirmasi Password Baru</label>
                      <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Ulangi sandi baru" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={loadingPassword} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50">
                      {loadingPassword ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                      Perbarui Password
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}