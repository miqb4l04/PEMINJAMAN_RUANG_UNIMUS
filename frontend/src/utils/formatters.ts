/**
 * Mengubah format tanggal standar menjadi format Indonesia
 * Contoh: 2026-06-07 -> 07 Juni 2026
 */
export const formatTanggalIndo = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

/**
 * Mengubah status booking menjadi warna badge (Tailwind)
 */
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'MENUNGGU_RT':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'MENUNGGU_KEPALA':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'DISETUJUI':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'DITOLAK':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'BUTUH_REVISI':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};