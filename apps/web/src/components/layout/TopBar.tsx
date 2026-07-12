'use client';
import { Bell, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TopBar() {
  const router = useRouter();
  const [alerts, setAlerts] = useState(0);

  useEffect(() => {
    fetch('/api/inventory/alerts').then(r => r.json()).then((d: unknown[]) => setAlerts(d.length)).catch(() => {});
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <div />
      <div className="flex items-center gap-3">
        {alerts > 0 && (
          <button onClick={() => router.push('/inventory')} className="relative p-2 text-amber-500 hover:bg-amber-50 rounded-lg" title={`${alerts} con stock bajo`}>
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{alerts}</span>
          </button>
        )}
        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center"><User size={15} className="text-teal-700" /></div>
          <button onClick={logout} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Cerrar sesión"><LogOut size={16} /></button>
        </div>
      </div>
    </header>
  );
}
