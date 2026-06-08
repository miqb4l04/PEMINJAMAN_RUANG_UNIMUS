import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Gedung } from '../types';
import { PlusCircle, Edit3, Trash2, MapPin, Building2, Search, X, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast'; // <--- IMPORT TOAST
import LoadingSpinner from '../components/LoadingSpinner'; // <--- IMPORT SPINNER
import EmptyState from '../components/EmptyState'; // <--- IMPORT EMPTY STATE

export default function MasterGedung() {
  const [gedungs, setGedungs] = useState<Gedung[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formKode, setFormKode] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formLokasi, setFormLokasi] = useState('');

  const fetchGedungs = async () => {
    try {
      setLoading(true);
      const data = await api.get('/gedung');
      setGedungs(data);
    } catch (err: any) {
      toast.error('Gagal memuat daftar gedung.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGedungs();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormKode('');
    setFormNama('');
    setFormLokasi('');
    setShowModal(true);
  };

  const openEditModal = (gedung: Gedung) => {
    setEditingId(gedung.id);
    setFormKode(gedung.kode);
    setFormNama(gedung.nama);
    setFormLokasi(gedung.lokasi);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKode.trim() || !formNama.trim() || !formLokasi.trim()) {
      toast.error('Semua kolom wajib diisi.');
      return;
    }

    try {
      if (editingId) {
        await api.put(`/gedung/${editingId}`, {
          kode: formKode.trim(),
          nama: formNama.trim(),
          lokasi: formLokasi.trim()
        });
        toast.success('Gedung berhasil diperbarui!');
      } else {
        await api.post('/gedung', {
          kode: formKode.trim(),
          nama: formNama.trim(),
          lokasi: formLokasi.trim()
        });
        toast.success('Gedung baru berhasil ditambahkan!');
      }

      setShowModal(false);
      fetchGedungs();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan data gedung.');
    }
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus bangunan "${nama}"?`)) {
      return;
    }

    try {
      await api.delete(`/gedung/${id}`);
      toast.success('Gedung berhasil dihapus!');
      fetchGedungs();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menghapus gedung. Pastikan gedung tidak memiliki relasi ruangan.');
    }
  };

  const filteredGedungs = gedungs.filter(
    g =>
      g.nama.toLowerCase().includes(search.toLowerCase()) ||
      g.kode.toLowerCase().includes(search.toLowerCase()) ||
      g.lokasi.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6" 
    >
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-black tracking-tight text-slate-900 font-sans">
              Master Data Gedung
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Kelola data fisik gedung, nama, kode identitas, dan lokasi prasarana di lingkungan UNIMUS.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center gap-2 cursor-pointer border-none"
        >
          <PlusCircle className="w-4 h-4" />
          Tambah Gedung Baru
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Cari gedung berdasarkan nama, kode..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <span className="text-[10px] text-slate-400 font-mono tracking-wider font-bold uppercase">
            Total: {filteredGedungs.length} Gedung
          </span>
        </div>

        {loading ? (
          <div className="py-16">
            <LoadingSpinner text="Menghubungkan & memuat data gedung..." />
          </div>
        ) : filteredGedungs.length === 0 ? (
          <div className="py-16">
            <EmptyState 
              icon={<Building2 className="w-12 h-12 text-slate-300" />} 
              title="Tidak ada data ditemukan" 
              description="Coba gunakan filter kata kunci lain atau tambahkan data gedung baru untuk memulai." 
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] text-slate-500 font-bold tracking-wider uppercase font-mono">
                  <th className="py-4 px-6 w-20">ID</th>
                  <th className="py-4 px-6 w-28">Kode Gedung</th>
                  <th className="py-4 px-6">Nama Bangunan</th>
                  <th className="py-4 px-6">Lokasi Kampus</th>
                  <th className="py-4 px-6 text-right w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredGedungs.map((gedung) => (
                  <tr key={gedung.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-6 font-mono text-slate-400 font-bold">#{gedung.id}</td>
                    <td className="py-3.5 px-6">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-[10px] font-bold font-mono">
                        {gedung.kode}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900">{gedung.nama}</td>
                    <td className="py-3.5 px-6 text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>{gedung.lokasi}</span>
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-1.5">
                      <button
                        onClick={() => openEditModal(gedung)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex cursor-pointer border-none bg-transparent"
                        title="Edit Gedung"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(gedung.id, gedung.nama)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex cursor-pointer border-none bg-transparent"
                        title="Hapus Gedung"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-sm tracking-tight text-slate-900 flex items-center gap-2">
                <Building2 className="w-4.5 h-4.5 text-indigo-600" />
                {editingId ? 'Edit Data Gedung' : 'Tambah Gedung Baru'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Kode Gedung</label>
                <input type="text" placeholder="Contoh: GKB1, LABMED, REK" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all font-semibold font-mono" value={formKode} onChange={(e) => setFormKode(e.target.value.toUpperCase())} required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Nama Lengkap Gedung</label>
                <input type="text" placeholder="Contoh: Gedung Kuliah Bersama I (GKB I)" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all font-medium" value={formNama} onChange={(e) => setFormNama(e.target.value)} required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Lokasi Kampus / Alamat</label>
                <textarea rows={2} placeholder="Contoh: Kampus Barat, Jl. Kedungmundu Raya No.125" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all font-medium" value={formLokasi} onChange={(e) => setFormLokasi(e.target.value)} required />
              </div>

              {editingId && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-800 font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 animate-bounce" />
                  <span>Memperbarui kode gedung juga akan memperbarui sinkronisasi tampilan ruangan terkait.</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-colors cursor-pointer">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 cursor-pointer border-none">
                  {editingId ? 'Simpan Perubahan' : 'Daftarkan Gedung'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}