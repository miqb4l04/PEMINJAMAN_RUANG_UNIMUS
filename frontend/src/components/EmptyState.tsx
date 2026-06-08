import React, { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode; // Tombol opsional (misal: "Buat Pengajuan Sekarang")
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-slate-200 border-dashed rounded-3xl shadow-sm">
      <div className="p-4 mb-5 bg-slate-50 text-slate-400 rounded-full shadow-inner">
        {icon}
      </div>
      <h3 className="text-lg font-black text-slate-800 mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed font-medium">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}