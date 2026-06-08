import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ text = 'Memuat data...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4 w-full">
      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      <p className="text-sm font-bold text-slate-500 animate-pulse tracking-wide">{text}</p>
    </div>
  );
}