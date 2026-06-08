import React, { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto space-y-4 animate-fade-in">
      <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 shadow-sm">
        {icon}
      </div>
      <div className="space-y-1.5">
        <h3 className="font-black text-slate-800 text-lg tracking-tight">{title}</h3>
        <p className="text-xs font-medium text-slate-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}