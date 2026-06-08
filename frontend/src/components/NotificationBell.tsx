import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCircle2, Info, XCircle, AlertTriangle } from 'lucide-react';
// @ts-ignore
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext'; 

interface AppNotification {
  id: number;
  pesan: string; 
  dibaca: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const { user } = useAuth(); 
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Mengambil notifikasi dari API
  const fetchNotifications = async () => {
    if (!user) return; 

    try {
      const data = await api.get('/notifications'); 
      
      // RADAR CONSOLE (Untuk melihat langsung apakah data benar-benar masuk)
      console.log("📡 DATA NOTIF DARI BACKEND:", data); 

      if (Array.isArray(data)) {
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("🚨 GAGAL TARIK NOTIF:", error);
      setNotifications([]);
    }
  };

  useEffect(() => {
    fetchNotifications();
    if (user) {
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.dibaca).length;

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`, {});
      setNotifications(notifications.map(n => n.id === id ? { ...n, dibaca: true } : n));
    } catch (error) {}
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all', {});
      setNotifications(notifications.map(n => ({ ...n, dibaca: true })));
    } catch (error) {}
  };

  const getIcon = (pesan: string) => {
    if (!pesan) return <Info className="w-5 h-5 text-indigo-500 mt-1 flex-shrink-0" />;
    
    const msgUpper = pesan.toUpperCase();
    if (msgUpper.includes('DISETUJUI') || msgUpper.includes('✅')) {
      return <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1 flex-shrink-0" />;
    }
    if (msgUpper.includes('DITOLAK') || msgUpper.includes('❌')) {
      return <XCircle className="w-5 h-5 text-rose-500 mt-1 flex-shrink-0" />;
    }
    if (msgUpper.includes('PERALIHAN') || msgUpper.includes('🔄')) {
      return <AlertTriangle className="w-5 h-5 text-amber-500 mt-1 flex-shrink-0" />;
    }
    return <Info className="w-5 h-5 text-indigo-500 mt-1 flex-shrink-0" />;
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => { setIsOpen(!isOpen); if(!isOpen) fetchNotifications(); }}
        className="relative p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all duration-200 focus:outline-none cursor-pointer"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white animate-pulse shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <div 
        className={`absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-[100] origin-top-right transition-all duration-200 ${
          isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible pointer-events-none'
        }`}
      >
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-500" /> Notifikasi
          </h3>
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer border-none bg-transparent"
            >
              <Check className="w-3 h-3" /> Tandai Semua Dibaca
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-xs font-semibold">Belum ada notifikasi baru</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {notifications.map(notif => (
                <div 
                  key={notif.id} 
                  onClick={() => !notif.dibaca && markAsRead(notif.id)}
                  className={`p-4 flex gap-3 transition-colors ${notif.dibaca ? 'opacity-60 cursor-default' : 'bg-indigo-50/30 hover:bg-slate-50 cursor-pointer'}`}
                >
                  {getIcon(notif.pesan)}
                  <div className="space-y-1">
                    <p className={`text-xs leading-relaxed ${notif.dibaca ? 'text-slate-600' : 'text-slate-800 font-bold'}`}>
                      {notif.pesan}
                    </p>
                    <p className="text-[9px] text-slate-400 font-mono">
                      {new Date(notif.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  {!notif.dibaca && <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0 animate-pulse" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}