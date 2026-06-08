import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Ruang, Gedung } from '../types';
import { PlusCircle, Edit3, Trash2, Home, Sparkles, Search, X, Layers, Users, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast'; // <--- IMPORT TOAST
import LoadingSpinner from '../components/LoadingSpinner'; // <--- IMPORT SPINNER
import EmptyState from '../components/EmptyState'; // <--- IMPORT EMPTY STATE

export default function MasterRuang() {
  const [ruangs, setRuangs] = useState<Ruang[]>([]);
  const [gedungs, setGedungs] = useState<Gedung[]>([]);
  const [search, setSearch] = useState('');
  const [filterGedung, setFilterGedung] = useState<string>('all');
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLimit(10);
  }, [search, filterGedung]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formKode, setFormKode] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formGedungId, setFormGedungId] = useState('');
  const [formLantai, setFormLantai] = useState('1');
  const [formKapasitas, setFormKapasitas] = useState('40');
  const [formJenis, setFormJenis] = useState('Kelas Teori');
  const [formFasilitas, setFormFasilitas] = useState('');

  const jenisOptions = ['Kelas Teori', 'Kelas Praktikum', 'Lab Komputer', 'Lab Praktik', 'Aula', 'Seminar', 'Kantor', 'Tutorial', 'Skill Lab', 'KM/WC'];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ruangsData, gedungsData] = await Promise.all([
        api.get('/ruang'),
        api.get('/gedung')
      ]);
      setRuangs(ruangsData);
      setGedungs(gedungsData);
    } catch (err: any) {
      toast.error('Gagal memuat prasarana ruangan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormKode('');
    setFormNama('');
    setFormGedungId(gedungs.length > 0 ? String(gedungs[0].id) : '');
    setFormLantai('1');
    setFormKapasitas('40');
    setFormJenis('Kelas Teori');
    setFormFasilitas('');
    setShowModal(true);
  };

  const openEditModal = (ruang: Ruang) => {
    setEditingId(ruang.id);
    setFormKode(ruang.kode);
    setFormNama(ruang.nama);
    setFormGedungId(String(ruang.gedungId));
    setFormLantai(String(ruang.lantai));
    setFormKapasitas(String(ruang.kapasitas));
    setFormJenis(ruang.jenis);
    setFormFasilitas(ruang.fasilitas || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKode.trim() || !formNama.trim() || !formGedungId || !formLantai || !formKapasitas || !formJenis) {
      toast.error('Mohon lengkapi semua kolom wajib.');
      return;
    }

    try {
      const payload = {
        kode: formKode.trim(),
        nama: formNama.trim(),
        gedungId: parseInt(formGedungId),
        lantai: parseInt(formLantai),
        kapasitas: parseInt(formKapasitas),
        jenis: formJenis,
        fasilitas: formFasilitas.trim()
      };

      if (editingId) {
        await api.put(`/ruang/${editingId}`, payload);
        toast.success('Ruangan berhasil diperbarui!');
      } else {
        await api.post('/ruang', payload);
        toast.success('Ruangan baru berhasil terdaftar!');
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan data ruangan.');
    }
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus ruangan "${nama}"?`)) {
      return;
    }

    try {
      await api.delete(`/ruang/${id}`);
      toast.success('Ruangan berhasil dihapus!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal menghapus ruangan. Pastikan tidak ada berkas peminjaman aktif.');
    }
  };

  const filteredRuangs = ruangs.filter(r => {
    const matchesSearch =
      r.nama.toLowerCase().includes(search.toLowerCase()) ||
      r.kode.toLowerCase().includes(search.toLowerCase()) ||
      (r.jenis && r.jenis.toLowerCase().includes(search.toLowerCase()));
    
    const matchesGedung = filterGedung === 'all' || r.gedungId === parseInt(filterGedung);
    return matchesSearch && matchesGedung;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Home className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-black tracking-tight text-slate-900 font-sans">Master Data Ruangan</h2>
          </div>
          <p className="text-xs text-slate-500">Daftarkan ruangan kelas teori, laboratorium praktikum, aula serbaguna, hingga prasarana akademik.</p>
        </div>

        <button onClick={openAddModal} disabled={gedungs.length === 0} className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center gap-2 cursor-pointer disabled:opacity-50 border-none">
          <PlusCircle className="w-4 h-4" /> Tambah Ruang Baru
        </button>
      </div>

      {gedungs.length === 0 && !loading && (
        <div className="p-4.5 bg-amber-50 border border-amber-100 rounded-2xl text-[11px] text-amber-800 font-medium flex items-center gap-1.5 animate-pulse">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>Harap daftarkan Gedung fisik terlebih dahulu sebelum menambahkan data ruangan baru.</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-xs">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Search className="w-4 h-4" /></span>
              <input type="text" placeholder="Cari ruang..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="relative">
              <select className="pl-3.5 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-semibold appearance-none cursor-pointer" value={filterGedung} onChange={(e) => setFilterGedung(e.target.value)}>
                <option value="all">Semua Gedung UNIMUS</option>
                {gedungs.map(g => <option key={g.id} value={g.id}>{g.nama} ({g.kode})</option>)}
              </select>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-mono tracking-wider font-bold uppercase">Jumlah Terfilter: {filteredRuangs.length} Ruang</span>
        </div>

        {loading ? (
          <div className="py-16"><LoadingSpinner text="Memuat database prasarana kampus..." /></div>
        ) : filteredRuangs.length === 0 ? (
          <div className="py-16">
            <EmptyState icon={<Home className="w-12 h-12 text-slate-300" />} title="Tidak ada ruangan ditemukan" description="Sesuaikan kata kunci pencarian Anda atau tambahkan ruangan baru sekarang ke dalam database." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] text-slate-500 font-bold tracking-wider uppercase font-mono">
                  <th className="py-4 px-6 w-20">ID</th>
                  <th className="py-4 px-6 w-28">Kode Ruang</th>
                  <th className="py-4 px-6">Nama Ruangan & Deskripsi</th>
                  <th className="py-4 px-6">Gedung Fisik</th>
                  <th className="py-4 px-6">Lantai</th>
                  <th className="py-4 px-6">Kapasitas</th>
                  <th className="py-4 px-6">Jenis</th>
                  <th className="py-4 px-6 text-right w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredRuangs.slice(0, limit).map((ruang) => {
                  const bldg = gedungs.find(g => g.id === ruang.gedungId);
                  return (
                    <tr key={ruang.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-6 font-mono text-slate-400 font-bold">#{ruang.id}</td>
                      <td className="py-3.5 px-6"><span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-[10px] font-bold font-mono">{ruang.kode}</span></td>
                      <td className="py-3.5 px-6">
                        <p className="font-bold text-slate-900">{ruang.nama}</p>
                        {ruang.fasilitas && <p className="text-[10px] text-slate-500 font-mono mt-0.5">{ruang.fasilitas}</p>}
                      </td>
                      <td className="py-3.5 px-6"><span className="font-semibold text-indigo-700">{bldg ? bldg.nama : `Gedung id #${ruang.gedungId}`}</span></td>
                      <td className="py-3.5 px-6 font-mono text-slate-500"><span className="inline-flex items-center gap-1"><Layers className="w-3 h-3 text-slate-400" /> Lantai {ruang.lantai === 0 ? 'G (Ground)' : ruang.lantai}</span></td>
                      <td className="py-3.5 px-6"><span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold"><Users className="w-3.5 h-3.5 text-blue-500" /> {ruang.kapasitas} Kursi</span></td>
                      <td className="py-3.5 px-6 text-slate-500 font-medium">{ruang.jenis}</td>
                      <td className="py-3.5 px-6 text-right space-x-1.5">
                        <button onClick={() => openEditModal(ruang)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex cursor-pointer border-none bg-transparent" title="Edit Ruang"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(ruang.id, ruang.nama)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex cursor-pointer border-none bg-transparent" title="Hapus Ruang"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredRuangs.length > limit && (
              <div className="p-4 bg-slate-50/50 border-t border-slate-105 flex justify-center">
                <button type="button" onClick={() => setLimit(prev => prev + 10)} className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors border border-indigo-200/50 cursor-pointer flex items-center gap-2 shadow-sm">
                  Tampilkan Lebih Banyak ({filteredRuangs.length - limit} Ruang Lagi)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-sm tracking-tight text-slate-900 flex items-center gap-2"><Sparkles className="w-4.5 h-4.5 text-indigo-600" /> {editingId ? 'Edit Data Ruangan' : 'Daftarkan Ruangan Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer border-none"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Kode Ruangan *</label><input type="text" placeholder="Contoh: 1A101" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all font-semibold font-mono" value={formKode} onChange={(e) => setFormKode(e.target.value.toUpperCase())} required /></div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Tipe / Ketegori *</label>
                  <select className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all font-semibold" value={formJenis} onChange={(e) => setFormJenis(e.target.value)} required>
                    {jenisOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
              <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Nama Ruangan *</label><input type="text" placeholder="Contoh: Ruang Kelas Teori GKB 101" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all font-semibold" value={formNama} onChange={(e) => setFormNama(e.target.value)} required /></div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Gedung Induk *</label>
                <select className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all font-semibold" value={formGedungId} onChange={(e) => setFormGedungId(e.target.value)} required>
                  <option value="" disabled>--- Pilih Gedung ---</option>
                  {gedungs.map(g => <option key={g.id} value={g.id}>{g.nama} ({g.kode})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Lantai Ke- *</label><input type="number" min="0" max="10" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all font-semibold font-mono" value={formLantai} onChange={(e) => setFormLantai(e.target.value)} required /><p className="text-[9px] text-slate-400 mt-0.5">*(Isi 0 untuk Lantai Ground)</p></div>
                <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Kapasitas (Orang) *</label><input type="number" min="1" max="1000" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all font-semibold font-mono" value={formKapasitas} onChange={(e) => setFormKapasitas(e.target.value)} required /></div>
              </div>
              <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-mono">Rincian Fasilitas</label><textarea rows={2} placeholder="Contoh: Luas 64 m², AC, Proyektor, Papan Tulis" className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-all font-medium" value={formFasilitas} onChange={(e) => setFormFasilitas(e.target.value)} /></div>
              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition-colors cursor-pointer border-none">Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 cursor-pointer border-none">{editingId ? 'Simpan Perubahan' : 'Daftarkan Ruang'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}