import React from 'react';
import { Booking } from '../types';
import { X, Printer, FileText, Stamp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast'; // <--- IMPORT TOAST

interface SuratDisposisiModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function SuratDisposisiModal({ booking, isOpen, onClose }: SuratDisposisiModalProps) {
  if (!isOpen || !booking) return null;

  const generateLetterNumber = (id: number) => {
    const paddedId = String(id).padStart(4, '0');
    return `${paddedId}/UNIMUS-SIPRUS/BAUK-RT/V/2026`;
  };

  const handlePrint = () => {
    const printContent = document.getElementById('print-area-dispositions');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Gagal membuka jendela cetak. Pastikan pop-up diperbolehkan di browser Anda.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Surat Disposisi UniRoom UNIMUS - #${booking.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
            
            @page { size: A4 portrait; margin: 10mm 15mm 10mm 15mm; }
            * { box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 0; margin: 0; line-height: 1.35; font-size: 11px; background-color: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .letter-container { width: 100%; max-width: 100%; margin: 0 auto; }
            .kop-surat { display: flex; align-items: center; border-bottom: 3px double #334155; padding-bottom: 8px; margin-bottom: 12px; }
            .logo-placeholder { width: 54px; height: 54px; background-color: #1e3a8a; color: white; border-radius: 10px; display: flex; justify-content: center; align-items: center; font-weight: 800; font-size: 18px; margin-right: 15px; flex-shrink: 0; }
            .kop-text h1 { font-size: 13px; font-weight: 800; text-transform: uppercase; margin: 0; letter-spacing: 0.3px; color: #1e3a8a; line-height: 1.2; }
            .kop-text h2 { font-size: 11px; font-weight: 700; margin: 1px 0; color: #0f172a; line-height: 1.2; }
            .kop-text p { font-size: 8.5px; color: #64748b; margin: 0; line-height: 1.3; }
            .doc-title { text-align: center; margin-bottom: 12px; }
            .doc-title h3 { font-size: 12px; font-weight: 800; text-transform: uppercase; text-decoration: underline; margin: 0; color: #0f172a; letter-spacing: 0.5px; }
            .doc-title p { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #475569; margin: 2px 0 0 0; }
            .opening-text { font-size: 10.5px; color: #334155; margin-bottom: 10px; line-height: 1.45; }
            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            .info-table td { padding: 5px 8px; vertical-align: middle; font-size: 10.5px; border-bottom: 1px solid #f1f5f9; }
            .info-table td.label { font-weight: 700; color: #475569; width: 25%; text-transform: uppercase; font-size: 8.5px; letter-spacing: 0.5px; }
            .status-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; background-color: #dcfce7; color: #15803d; font-size: 9px; font-weight: 700; border-radius: 4px; border: 1px solid #bbf7d0; }
            .notes-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; font-size: 10px; margin-bottom: 15px; line-height: 1.4; }
            .notes-box.relocated { background-color: #fffbeb; border: 1px solid #fde68a; color: #78350f; }
            .notes-title { font-weight: 800; font-size: 8.5px; color: #475569; text-transform: uppercase; margin-bottom: 4px; display: flex; align-items: center; gap: 4px; }
            .notes-box.relocated .notes-title { color: #b45309; }
            .notes-list { margin: 0; padding-left: 14px; }
            .notes-list li { margin-bottom: 2px; }
            .signature-section { margin-top: 15px; display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; page-break-inside: avoid; }
            .qr-code-box { display: flex; align-items: center; gap: 10px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; max-width: 260px; }
            .qr-placeholder-wrapper { width: 38px; height: 38px; background-color: white; border: 1px solid #cbd5e1; border-radius: 4px; padding: 3px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
            .qr-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; width: 100%; height: 100%; }
            .qr-pixel { background-color: #0f172a; border-radius: 1px; }
            .qr-text-block { display: flex; flex-direction: column; }
            .qr-title { font-weight: 800; font-size: 8px; color: #1e293b; text-transform: uppercase; letter-spacing: 0.3px; }
            .qr-code { font-size: 8.5px; font-family: 'JetBrains Mono', monospace; color: #475569; font-weight: 700; margin: 1px 0; }
            .qr-approved { font-size: 8px; color: #16a34a; font-weight: 700; }
            .sig-box { width: 180px; text-align: center; }
            .sig-date { font-size: 9px; color: #64748b; display: block; margin-bottom: 2px; }
            .sig-role { font-weight: 700; font-size: 10px; color: #1e293b; display: block; }
            .sig-space { height: 55px; margin: 3px 0; display: flex; justify-content: center; align-items: center; position: relative; }
            .sig-stamp-sim { position: absolute; border: 2px dashed #4f46e5; color: #4f46e5; font-size: 7.5px; font-weight: 900; text-transform: uppercase; width: 64px; height: 64px; border-radius: 50%; transform: rotate(-6deg); opacity: 0.85; display: flex; flex-direction: column; justify-content: center; align-items: center; line-height: 1.1; background-color: rgba(255, 255, 255, 0.9); }
            .sig-stamp-system { font-size: 5.5px; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.2px; margin-top: 1px; color: #64748b; }
            .sig-author-name { position: absolute; font-family: 'Georgia', serif; font-size: 11px; font-style: italic; font-weight: bold; color: #1e3a8a; opacity: 0.45; pointer-events: none; }
            .sig-name { font-weight: 700; text-decoration: underline; color: #0f172a; font-size: 10.5px; display: block; }
            .sig-nip { font-size: 8.5px; color: #64748b; display: block; margin-top: 1px; }
            .footer-info { margin-top: 18px; font-size: 8.5px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 8px; font-family: 'JetBrains Mono', monospace; }
            .hidden-print { display: none; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="letter-container">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const formatDateFull = (rawDate: string) => {
    try {
      const date = new Date(rawDate);
      return date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return rawDate;
    }
  };

  const bookingDateStr = booking.createdAt 
    ? new Date(booking.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-4 md:my-8"
        >
          <div className="bg-slate-900 text-white p-4 flex justify-between items-center px-6 print:hidden shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="font-extrabold text-[13px] tracking-tight">Dokumen Surat Disposisi & Izin Pemakaian</h3>
                <p className="text-[10px] text-slate-400 font-semibold font-mono">ID Reservasi #{booking.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handlePrint} className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border-none">
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print / Simpan PDF</span>
              </button>
              <button onClick={onClose} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer border-none">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 md:p-6 overflow-y-auto max-h-[76vh] flex-grow bg-slate-100">
            <div id="print-area-dispositions" className="bg-white p-6 md:p-8 border border-slate-200 rounded-2xl relative shadow-sm max-w-2xl mx-auto">
              <div className="absolute top-40 right-14 opacity-[0.02] pointer-events-none select-none hidden md:block">
                <Stamp className="w-72 h-72 text-indigo-950" />
              </div>

              <div className="kop-surat flex items-center border-b-[3px] border-double border-slate-700 pb-3 mb-4">
                <div className="logo-placeholder bg-indigo-900 text-white w-14 h-14 rounded-xl font-black text-lg flex items-center justify-center mr-4 shrink-0 select-none">
                  UM
                </div>
                <div className="kop-text">
                  <h1 className="font-black text-slate-900 text-[12px] md:text-[13px] uppercase tracking-wide leading-tight">
                    PANITIA PRASARANA & RUMAH TANGGA
                  </h1>
                  <h2 className="font-extrabold text-indigo-900 text-[11px] md:text-[12px] uppercase tracking-tight leading-snug">
                    UNIVERSITAS MUHAMMADIYAH SEMARANG (UNIMUS)
                  </h2>
                  <p className="text-[9px] text-slate-500 font-medium">
                    Alamat Resmi: Gedung Rektorat Lt. 2, Jl. Kedungmundu Raya No. 125, Semarang 50273 • Telp: (024) 76740295
                  </p>
                  <p className="text-[8.5px] text-[#4f46e5] font-bold font-mono">
                    Situs Portal: siprus.unimus.ac.id • Email: rumahtangga@unimus.ac.id
                  </p>
                </div>
              </div>

              <div className="doc-title text-center mb-3">
                <h3 className="font-black text-slate-900 tracking-wide text-[12px] underline uppercase">
                  SURAT IZIN & DISPOSISI PEMAKAIAN SARANA
                </h3>
                <p className="font-mono text-[9px] text-slate-500 font-extrabold mt-0.5">
                  NOMOR SURAT: {generateLetterNumber(booking.id)}
                </p>
              </div>

              <p className="opening-text text-[11px] text-slate-600 leading-relaxed mb-3">
                Berdasarkan permohonan pengajuan peminjaman ruangan yang didaftarkan melalui sistem informasi 
                <strong> SIPRUS UNIMUS (UniRoom)</strong>, Kepala Urusan Rumah Tangga Universitas Muhammadiyah Semarang 
                menerangkan bahwa permohonan berikut dinyatakan <strong className="text-emerald-700">DISETUJUI SEPENUHNYA</strong> untuk digunakan sesuai peruntukan:
              </p>

              <table className="info-table w-full mb-3 border-collapse">
                <tbody>
                  <tr>
                    <td className="label text-slate-500 font-bold text-[8.5px] tracking-wider py-1.5 w-1/4 uppercase border-b border-slate-100">Nama Pemesan</td>
                    <td className="text-[11px] font-extrabold text-slate-800 py-1.5 border-b border-slate-100">{booking.user?.name || 'Mahasiswa UNIMUS'}</td>
                  </tr>
                  <tr>
                    <td className="label text-slate-500 font-bold text-[8.5px] tracking-wider py-1.5 uppercase border-b border-slate-100">Email Civitas</td>
                    <td className="text-[11px] font-mono font-bold text-indigo-700 py-1.5 border-b border-slate-100">{booking.user?.email || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="label text-slate-500 font-bold text-[8.5px] tracking-wider py-1.5 uppercase border-b border-slate-100">Ruang Prasarana</td>
                    <td className="text-[11px] font-extrabold text-slate-900 py-1.5 border-b border-slate-100">{booking.ruang?.nama || `Ruangan (ID: ${booking.ruangId})`}</td>
                  </tr>
                  <tr>
                    <td className="label text-slate-500 font-bold text-[8.5px] tracking-wider py-1.5 uppercase border-b border-slate-100">Gedung & Lokasi</td>
                    <td className="text-[10.5px] font-semibold text-slate-700 py-1.5 border-b border-slate-100">
                      {booking.ruang?.gedung?.nama || 'Unimus Building'} — Lantai {booking.ruang?.lantai || 1} 
                      <span className="text-indigo-600 font-bold"> ({booking.ruang?.gedung?.lokasi || 'Kampus Utama UNIMUS'})</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="label text-slate-500 font-bold text-[8.5px] tracking-wider py-1.5 uppercase border-b border-slate-100">Tanggal Pemakaian</td>
                    <td className="text-[11px] font-black text-slate-900 py-1.5 border-b border-slate-100">{formatDateFull(booking.tanggal)}</td>
                  </tr>
                  <tr>
                    <td className="label text-slate-500 font-bold text-[8.5px] tracking-wider py-1.5 uppercase border-b border-slate-100">Alokasi Waktu</td>
                    <td className="text-[11px] font-extrabold text-slate-800 py-1.5 border-b border-slate-100">Pukul {booking.waktuMulai} s/d {booking.waktuSelesai} WIB</td>
                  </tr>
                  <tr>
                    <td className="label text-slate-500 font-bold text-[8.5px] tracking-wider py-1.5 uppercase border-b border-slate-100 align-top">Agenda Kegiatan</td>
                    <td className="text-[10.5px] italic font-semibold text-slate-700 py-1.5 border-b border-slate-100">
                      <div className="bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 inline-block w-full">"{booking.keperluan}"</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="label text-slate-500 font-bold text-[8.5px] tracking-wider py-1.5 uppercase border-b border-slate-100">Kapasitas Ruang</td>
                    <td className="text-[10.5px] font-semibold text-slate-600 py-1.5 border-b border-slate-100">Maksimum {booking.ruang?.kapasitas || 30} Orang Sektor Kursi</td>
                  </tr>
                  <tr>
                    <td className="label text-slate-500 font-bold text-[8.5px] tracking-wider py-1.5 uppercase">Otorisasi Terdaftar</td>
                    <td className="text-[10.5px] py-1.5">
                      <span className="status-badge inline-flex gap-1 items-center font-bold px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-[9px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                        TERVERIFIKASI RUMAH TANGGA
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              {booking.catatanPeralihan ? (
                <div className="notes-box relocated bg-amber-50/40 border border-amber-200 rounded-xl p-3 mb-4 text-[10px] text-amber-900 leading-relaxed">
                  <div className="notes-title flex items-center gap-1 font-bold text-amber-700 mb-1 text-[8.5px] tracking-wider uppercase">🔄 Catatan Peralihan Khusus Biro Rumah Tangga:</div>
                  <p className="font-semibold italic text-amber-800">"Surat disposisi telah disesuaikan karena adanya pengalihan tempat (relocation) prasarana oleh Admin RT dari lokasi sebelumnya demi kelancaran kegiatan mahasiswa & prioritas rektorat UNIMUS. Catatan: {booking.catatanPeralihan}"</p>
                </div>
              ) : (
                <div className="notes-box bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-[10px] text-slate-700 leading-relaxed">
                  <div className="notes-title flex items-center gap-1 font-bold text-slate-500 mb-1 text-[8.5px] tracking-wider uppercase">Ketentuan Syarat Penggunaan:</div>
                  <ul className="notes-list list-decimal list-inside space-y-0.5 pl-0 text-[9.5px] font-medium text-slate-500">
                    <li>Harap tunjukkan surat disposisi ini (cetak/digital) kepada penjaga/satpam gedung sebelum memasuki ruangan.</li>
                    <li>Pemohon bertanggung jawab penuh atas kebersihan, ketertiban, dan pemeliharaan fasilitas ruangan selama acara.</li>
                    <li>Matikan seluruh lampu, pendingin ruangan (AC), dan proyektor setelah kegiatan selesai digunakan.</li>
                  </ul>
                </div>
              )}

              <div className="signature-section mt-4 flex flex-row justify-between items-center gap-4 text-[10.5px] text-slate-700">
                <div className="qr-code-box flex items-center gap-2.5 bg-slate-50 border border-slate-200/60 rounded-xl p-2 select-none">
                  <div className="qr-placeholder-wrapper bg-white border border-slate-200 rounded p-1 shrink-0 flex items-center justify-center">
                    <div className="qr-grid grid grid-cols-4 gap-0.5 w-full h-full opacity-90">
                      {[...Array(16)].map((_, i) => (
                        <div key={i} className={`qr-pixel w-1.5 h-1.5 ${(i % 3 === 0 || i % 7 === 0 || i === 0 || i === 15) ? 'bg-slate-900' : 'bg-transparent'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="qr-text-block space-y-0.5">
                    <span className="qr-title block font-bold text-slate-800 text-[8px] uppercase tracking-wide">Validasi Digital SIPRUS</span>
                    <p className="qr-code text-[8.5px] text-slate-500 font-bold leading-none font-mono">CODE: PR-{booking.id * 12}</p>
                    <p className="qr-approved text-[8px] text-emerald-600 font-bold leading-relaxed">Persetujuan Online Kepala Bagian Biro RT.</p>
                  </div>
                </div>

                <div className="sig-box w-44 text-center shrink-0">
                  <span className="sig-date block text-slate-500 text-[8.5px]">Semarang, {bookingDateStr}</span>
                  <span className="sig-role block text-slate-800 font-bold text-[9.5px] mt-0.5">Kepala Bagian Rumah Tangga,</span>
                  <div className="sig-space h-14 my-1.5 flex justify-center items-center relative">
                    <div className="sig-stamp-sim border-2 border-indigo-600/70 text-indigo-600 text-[7px] font-black uppercase rounded-full transform -rotate-6 w-[58px] h-[58px] flex flex-col justify-center items-center leading-none select-none">
                      <span className="tracking-widest">DISETUJUI</span>
                      <span className="text-[5.5px] text-slate-500 font-mono font-bold mt-0.5">BIRO RT</span>
                      <span className="text-[5px] tracking-wide mt-0.5">UNIMUS</span>
                    </div>
                    <div className="sig-author-name absolute font-serif text-[11px] text-indigo-900 select-none italic font-bold">Avril Lavigne, M.M.</div>
                  </div>
                  <div className="sig-name font-bold text-[10px] text-slate-900 underline leading-none">Avril Lavigne, M.M.</div>
                  <span className="sig-nip block text-[8px] text-slate-400 font-semibold mt-0.5 leading-none">NIDN. 0627098402</span>
                </div>
              </div>

              <div className="footer-info mt-4 text-center text-[8.5px] text-slate-400 border-t border-slate-100 pt-2 font-mono select-none">
                Dokumen ini diterbitkan sah secara hukum oleh Sistem Informasi SIPRUS - Universitas Muhammadiyah Semarang secara otomatis.
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end gap-2 px-6 print:hidden">
            <button onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer border-none shadow-sm">
              Tutup Jendela
            </button>
            <button onClick={handlePrint} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border-none shadow-md shadow-indigo-100 hover:shadow-indigo-200">
              <Printer className="w-4 h-4" />
              <span>Cetak Disposisi</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}