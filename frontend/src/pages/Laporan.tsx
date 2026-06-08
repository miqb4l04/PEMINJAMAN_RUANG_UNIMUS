import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Booking, Gedung } from '../types';
import { FileSpreadsheet, Calendar, Filter, Printer, RefreshCw, FileText, CheckCircle, Clock, XCircle, Search, Download, Zap, Building2, ShieldCheck, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast'; // <--- IMPORT TOAST
import SuratDisposisiModal from '../components/SuratDisposisiModal';
import LoadingSpinner from '../components/LoadingSpinner'; // <--- IMPORT SPINNER
import EmptyState from '../components/EmptyState'; // <--- IMPORT EMPTY STATE

export default function Laporan() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [gedungs, setGedungs] = useState<Gedung[]>([]);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [selectedDisposisi, setSelectedDisposisi] = useState<Booking | null>(null);

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedGedung, setSelectedGedung] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState('');

  useEffect(() => {
    setLimit(10);
  }, [startDate, endDate, selectedGedung, selectedStatus, searchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsData, gedungsData] = await Promise.all([
        api.get('/booking/all'),
        api.get('/gedung')
      ]);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setGedungs(Array.isArray(gedungsData) ? gedungsData : []);
    } catch (err: any) {
      toast.error('Gagal mengambil data laporan dari server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrint = () => window.print();

  const getDynamicTitleInfo = () => {
    let reportTitle = "Laporan Rekapitulasi Peminjaman Ruangan";
    let fileName = `Laporan_Peminjaman_SIPRUS_${new Date().getTime()}`;
    let periodeLabel = "Semua Waktu";

    if (startDate && endDate) {
      const d1 = new Date(startDate);
      const d2 = new Date(endDate);
      const optMonth: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };
      const optFull: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
      
      if (activeQuickFilter === 'hari_ini') {
        reportTitle = `Laporan Harian Peminjaman Ruangan`;
        periodeLabel = d1.toLocaleDateString('id-ID', optFull);
        fileName = `Laporan_Harian_${d1.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}`;
      } else if (activeQuickFilter === 'bulan_ini' || activeQuickFilter === 'bulan_lalu') {
        const monthYear = d1.toLocaleDateString('id-ID', optMonth);
        reportTitle = `Laporan Bulanan Peminjaman Ruangan`;
        periodeLabel = `Bulan ${monthYear}`;
        fileName = `Laporan_Bulan_${monthYear.replace(/ /g, '_')}`;
      } else if (activeQuickFilter === 'tahun_ini') {
        reportTitle = `Laporan Tahunan Peminjaman Ruangan`;
        periodeLabel = `Tahun ${d1.getFullYear()}`;
        fileName = `Laporan_Tahun_${d1.getFullYear()}`;
      } else {
        periodeLabel = `${d1.toLocaleDateString('id-ID', optFull)} s/d ${d2.toLocaleDateString('id-ID', optFull)}`;
        fileName = `Laporan_Kustom_${d1.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}_sd_${d2.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
      }
    }

    return { reportTitle, fileName, periodeLabel };
  };

  const handleExportExcel = () => {
    const { reportTitle, fileName, periodeLabel } = getDynamicTitleInfo();
    
    let gedungName = "Semua Gedung";
    if (selectedGedung !== 'all') {
       gedungName = gedungs.find(g => g.id === parseInt(selectedGedung))?.nama || "Semua Gedung";
    }

    let statusName = selectedStatus === 'all' ? 'Semua Status' : selectedStatus.replace('_', ' ');

    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
          th, td { border: 1px solid #dddddd; padding: 8px; text-align: left; }
          .header { background-color: #4f46e5; color: white; font-weight: bold; text-align: center; }
          .title-row { font-size: 18px; font-weight: bold; text-align: center; background-color: #ffffff; }
          .info-row { font-size: 12px; background-color: #ffffff; }
          .text-center { text-align: center; }
          .text-str { mso-number-format:"\\@"; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="10" class="title-row">UNIVERSITAS MUHAMMADIYAH SEMARANG</td></tr>
          <tr><td colspan="10" class="title-row">${reportTitle}</td></tr>
          <tr><td colspan="10" style="height: 10px;"></td></tr>
          
          <tr><td colspan="2" class="info-row"><b>Periode Rekap:</b></td><td colspan="8" class="info-row">${periodeLabel}</td></tr>
          <tr><td colspan="2" class="info-row"><b>Filter Gedung:</b></td><td colspan="8" class="info-row">${gedungName}</td></tr>
          <tr><td colspan="2" class="info-row"><b>Filter Status:</b></td><td colspan="8" class="info-row">${statusName}</td></tr>
          <tr><td colspan="2" class="info-row"><b>Tanggal Unduh:</b></td><td colspan="8" class="info-row">${new Date().toLocaleString('id-ID')}</td></tr>
          <tr><td colspan="10" style="height: 10px;"></td></tr>

          <tr>
            <th class="header">ID</th>
            <th class="header">Nama Mahasiswa</th>
            <th class="header">Email</th>
            <th class="header">Ruangan</th>
            <th class="header">Gedung</th>
            <th class="header">Tgl Main</th>
            <th class="header">Jam Mulai</th>
            <th class="header">Jam Selesai</th>
            <th class="header">Keperluan</th>
            <th class="header">Status Akhir</th>
          </tr>
    `;

    filteredBookings.forEach(b => {
      const g = gedungs.find(gd => gd.id === b.ruang?.gedungId);
      htmlContent += `
        <tr>
          <td class="text-center text-str">#${b.id}</td>
          <td>${b.user?.name || '-'}</td>
          <td>${b.user?.email || '-'}</td>
          <td>${b.ruang?.nama || '-'} (${b.ruang?.kode || '-'})</td>
          <td>${g?.nama || '-'}</td>
          <td class="text-center text-str">${b.tanggal}</td>
          <td class="text-center text-str">${b.waktuMulai}</td>
          <td class="text-center text-str">${b.waktuSelesai}</td>
          <td>${b.keperluan || '-'}</td>
          <td class="text-center"><b>${b.status}</b></td>
        </tr>
      `;
    });

    htmlContent += `
          <tr><td colspan="10" style="height: 10px;"></td></tr>
          <tr>
            <td colspan="9" style="text-align: right; font-weight: bold;">TOTAL TRANSAKSI:</td>
            <td class="text-center font-weight: bold;">${filteredBookings.length} Data</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setStartDate(''); setEndDate(''); setSelectedGedung('all'); setSelectedStatus('all'); setSearchQuery(''); setActiveQuickFilter('');
  };

  const applyQuickFilter = (type: string) => {
    setActiveQuickFilter(type);
    const today = new Date();
    const formatDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    let start = new Date(); let end = new Date();

    switch (type) {
      case 'hari_ini': start = today; end = today; break;
      case 'bulan_ini': start = new Date(today.getFullYear(), today.getMonth(), 1); end = new Date(today.getFullYear(), today.getMonth() + 1, 0); break;
      case 'bulan_lalu': start = new Date(today.getFullYear(), today.getMonth() - 1, 1); end = new Date(today.getFullYear(), today.getMonth(), 0); break;
      case 'tahun_ini': start = new Date(today.getFullYear(), 0, 1); end = new Date(today.getFullYear(), 11, 31); break;
      default: setStartDate(''); setEndDate(''); return;
    }

    setStartDate(formatDate(start)); setEndDate(formatDate(end));
  };

  const filteredBookings = bookings.filter((b) => {
    if (selectedGedung !== 'all' && b.ruang?.gedungId !== parseInt(selectedGedung)) return false;
    if (selectedStatus !== 'all' && b.status !== selectedStatus) return false;
    if (startDate && new Date(b.tanggal) < new Date(startDate)) return false;
    if (endDate && new Date(b.tanggal) > new Date(endDate)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.user?.name?.toLowerCase().includes(q) || 
        b.ruang?.nama?.toLowerCase().includes(q) || 
        b.ruang?.kode?.toLowerCase().includes(q) || 
        b.keperluan?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10" id="laporan-page">
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-5 mb-6">
        <h1 className="text-xl font-bold uppercase font-sans tracking-wide">UNIVERSITAS MUHAMMADIYAH SEMARANG</h1>
        <h2 className="text-md font-semibold text-slate-800 uppercase tracking-wide">SISTEM INFORMASI PRASARANA RUMAH TANGGA (SIPRUS)</h2>
        <p className="text-xs text-slate-500 mt-1 font-mono">Jl. Kedungmundu Raya No. 125, Semarang • Email: bauk@unimus.ac.id</p>
        <p className="text-[14px] font-bold mt-4 underline uppercase">{getDynamicTitleInfo().reportTitle}</p>
        <div className="text-[10px] text-slate-500 mt-1 text-right font-mono">Dicetak tanggal: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</div>
      </div>

      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-5 print:hidden transition-all">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-indigo-50/80 text-indigo-600 rounded-xl border border-indigo-100"><FileSpreadsheet className="w-5 h-5" /></div>
            <h2 className="text-xl font-bold text-slate-800">Laporan & Rekapitulasi</h2>
          </div>
          <p className="text-sm text-slate-500">Eksplorasi data, filter spesifik, dan unduh laporan peminjaman ruangan.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button onClick={() => { fetchData(); toast.success('Memperbarui data...'); }} title="Segarkan Data" className="p-2.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-500 hover:text-indigo-600 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleExportExcel} disabled={filteredBookings.length === 0} className="flex-1 md:flex-none py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer border-none">
            <Download className="w-4 h-4" /> Excel
          </button>
          <button onClick={handlePrint} disabled={filteredBookings.length === 0} className="flex-1 md:flex-none py-2.5 px-4 bg-slate-800 hover:bg-slate-900 active:bg-black text-white text-sm font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer border-none">
            <Printer className="w-4 h-4" /> Cetak PDF
          </button>
        </div>
      </div>

      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 print:hidden">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="flex items-center gap-2.5 text-slate-700 font-semibold text-sm">
            <Filter className="w-4 h-4 text-indigo-500" />
            <span>Kriteria Penyaringan</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="text-slate-400 mr-2 flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-500" /> Rentang Cepat:</span>
            {['hari_ini', 'bulan_ini', 'bulan_lalu', 'tahun_ini'].map((type) => {
              const label = type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
              return (
                <button key={type} onClick={() => applyQuickFilter(type)} className={`px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer ${activeQuickFilter === type ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Tanggal Mulai</label>
            <input type="date" className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm" value={startDate} onChange={(e) => { setStartDate(e.target.value); setActiveQuickFilter(''); }} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Tanggal Akhir</label>
            <input type="date" className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm" value={endDate} onChange={(e) => { setEndDate(e.target.value); setActiveQuickFilter(''); }} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Pilihan Gedung</label>
            <div className="relative">
              <select className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm appearance-none pr-10 cursor-pointer" value={selectedGedung} onChange={(e) => setSelectedGedung(e.target.value)}>
                <option value="all">Semua Gedung</option>
                {gedungs.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Status Pengajuan</label>
            <div className="relative">
              <select className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm appearance-none pr-10 cursor-pointer" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                <option value="all">Semua Status</option>
                <option value="MENUNGGU_RT">Menunggu Admin RT</option>
                <option value="MENUNGGU_KEPALA">Menunggu Kepala Biro</option>
                <option value="DISETUJUI">Telah Disetujui</option>
                <option value="DITOLAK_RT">Ditolak Admin</option>
                <option value="DITOLAK_KEPALA">Ditolak Kepala</option>
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Search className="w-4.5 h-4.5" /></span>
            <input type="text" placeholder="Cari nama mahasiswa, ruangan, atau keperluan..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <button onClick={handleResetFilters} className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-xl transition-all shadow-sm flex items-center justify-center whitespace-nowrap cursor-pointer">
            Bersihkan Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-none print:rounded-none">
        <div className="hidden print:grid grid-cols-4 gap-4 p-4 mb-4 border border-slate-300 rounded-lg text-xs">
          <div><span className="text-[10px] text-slate-500 uppercase block mb-0.5">Periode:</span><span className="font-semibold">{getDynamicTitleInfo().periodeLabel}</span></div>
          <div><span className="text-[10px] text-slate-500 uppercase block mb-0.5">Gedung:</span><span className="font-semibold">{selectedGedung === 'all' ? 'Semua' : gedungs.find(g => g.id === parseInt(selectedGedung))?.kode}</span></div>
          <div><span className="text-[10px] text-slate-500 uppercase block mb-0.5">Status:</span><span className="font-semibold">{selectedStatus === 'all' ? 'Semua' : selectedStatus.replace('_', ' ')}</span></div>
          <div><span className="text-[10px] text-slate-500 uppercase block mb-0.5">Total Data:</span><span className="font-semibold">{filteredBookings.length} Record</span></div>
        </div>

        {loading ? (
          <div className="py-24 print:hidden">
            <LoadingSpinner text="Menyiapkan data laporan..." />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-16 print:hidden">
            <EmptyState icon={<FileText className="w-12 h-12 text-slate-300" />} title="Tidak Ada Data" description="Kami tidak menemukan riwayat transaksi yang cocok dengan kombinasi filter yang Anda pilih." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm print:text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider print:bg-transparent">
                  <th className="py-4 px-5">ID</th>
                  <th className="py-4 px-5">Peminjam</th>
                  <th className="py-4 px-5">Ruang / Gedung</th>
                  <th className="py-4 px-5">Waktu Reservasi</th>
                  <th className="py-4 px-5 w-1/4">Keperluan</th>
                  <th className="py-4 px-5 text-center">Status</th>
                  <th className="py-4 px-5 text-center print:hidden">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredBookings.slice(0, limit).map((b) => {
                  const build = gedungs.find(g => g.id === b.ruang?.gedungId);
                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors print:hover:bg-transparent group">
                      <td className="py-4 px-5 font-mono text-slate-400 font-medium">#{b.id}</td>
                      <td className="py-4 px-5">
                        <p className="font-semibold text-slate-900">{b.user ? b.user.name : '-'}</p>
                        <p className="text-xs text-slate-500 mt-0.5 print:hidden">{b.user ? b.user.email : ''}</p>
                      </td>
                      <td className="py-4 px-5">
                        <p className="font-semibold text-slate-800">{b.ruang ? b.ruang.nama : '-'}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">{b.ruang?.kode}</span>
                          <span className="text-xs text-slate-500">{build ? build.nama : ''}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <p className="font-medium text-slate-800">{new Date(b.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        <p className="text-xs text-indigo-600 font-medium mt-0.5">{b.waktuMulai} - {b.waktuSelesai} WIB</p>
                      </td>
                      <td className="py-4 px-5 text-slate-600 text-xs leading-relaxed">{b.keperluan}</td>
                      <td className="py-4 px-5">
                        <div className="flex justify-center">
                          {b.status === 'DISETUJUI' && <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold rounded-full text-[10px] tracking-wide flex items-center gap-1.5"><CheckCircle className="w-3 h-3" /> DISETUJUI</span>}
                          {(b.status === 'MENUNGGU_RT' || b.status === 'MENUNGGU_KEPALA') && <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 font-semibold rounded-full text-[10px] tracking-wide flex items-center gap-1.5"><Clock className="w-3 h-3 animate-spin-slow" /> PENDING</span>}
                          {(b.status === 'DITOLAK_RT' || b.status === 'DITOLAK_KEPALA') && <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 font-semibold rounded-full text-[10px] tracking-wide flex items-center gap-1.5"><XCircle className="w-3 h-3" /> DITOLAK</span>}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-center print:hidden">
                        {b.status === 'DISETUJUI' ? (
                          <button onClick={() => setSelectedDisposisi(b)} className="p-1.5 px-3 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 border border-slate-200 shadow-sm text-xs rounded-lg font-medium transition-all mx-auto flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer" title="Lihat Surat">
                            <FileText className="w-3.5 h-3.5" /> Surat
                          </button>
                        ) : <span className="text-slate-300">-</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredBookings.length > limit && (
              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-center print:hidden">
                <button type="button" onClick={() => setLimit(prev => prev + 10)} className="px-6 py-2.5 bg-white text-indigo-600 font-semibold text-sm rounded-xl transition-all border border-slate-200 shadow-sm hover:shadow hover:border-indigo-200 flex items-center gap-2 cursor-pointer">
                  Muat Lebih Banyak ({filteredBookings.length - limit})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="hidden print:flex justify-between items-center mt-12 text-sm">
        <div className="text-center w-56">
          <p className="mb-20">Mengetahui,<br/><strong>Admin Rumah Tangga UNIMUS</strong></p>
          <div className="border-b border-black w-48 mx-auto"></div>
          <p className="text-xs text-slate-500 mt-1">NIP. .........................</p>
        </div>
        <div className="text-center w-56">
          <p className="mb-20">Mengesahkan,<br/><strong>Kepala Biro Administrasi Umum</strong></p>
          <div className="border-b border-black w-48 mx-auto"></div>
          <p className="text-xs text-slate-500 mt-1">Drs. H. Mulyono</p>
        </div>
      </div>

      {selectedDisposisi && (
        <SuratDisposisiModal booking={selectedDisposisi} isOpen={selectedDisposisi !== null} onClose={() => setSelectedDisposisi(null)} />
      )}
    </div>
  );
}