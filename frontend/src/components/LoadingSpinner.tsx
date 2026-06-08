import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
}

export default function LoadingSpinner({ text = 'Memuat data...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full p-12 min-h-[40vh]">
      <div className="relative flex items-center justify-center">
        {/* Lingkaran blur efek estetik di belakang spinner */}
        <div className="absolute w-16 h-16 bg-indigo-200 rounded-full blur-xl animate-pulse"></div>
        {/* Icon Spinner */}
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin relative z-10" />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-500 animate-pulse tracking-wide uppercase">
        {text}
      </p>
    </div>
  );
}