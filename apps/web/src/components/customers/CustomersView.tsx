'use client';
import { useEffect, useState } from 'react';
import { Search, MessageSquare, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CHANNEL_ICONS: Record<string, string> = { whatsappId: '📱', instagramId: '📸', messengerId: '💬' };

interface Customer { id: string; displayName: string; phone?: string; whatsappId?: string; instagramId?: string; messengerId?: string; createdAt: string; _count: { orders: number }; orders: Array<{ total: number; status: string }>; }

export default function CustomersView() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    fetch(`/api/customers${q}`).then(r => r.json()).then(data => { setCustomers(data); setLoading(false); });
  }, [search]);

  const totalRevenue = (c: Customer) => c.orders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div className="space-y-4">
      <div className="relative w-72">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr><th className="px-4 py-3 text-left font-medium">Cliente</th><th className="px-4 py-3 text-left font-medium">Canales</th><th className="px-4 py-3 text-center font-medium">Pedidos</th><th className="px-4 py-3 text-right font-medium">Gasto total</th><th className="px-4 py-3 text-left font-medium">Registrado</th><th className="px-4 py-3 text-center font-medium">Acciones</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">Cargando...</td></tr>}
            {!loading && customers.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">Sin clientes</td></tr>}
            {customers.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm shrink-0">{c.displayName[0].toUpperCase()}</div><div><p className="font-medium text-gray-900">{c.displayName}</p>{c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}</div></div></td>
                <td className="px-4 py-3"><div className="flex gap-1">{(['whatsappId', 'instagramId', 'messengerId'] as const).map(k => c[k] && <span key={k} className="text-base" title={k.replace('Id', '')}>{CHANNEL_ICONS[k]}</span>)}</div></td>
                <td className="px-4 py-3 text-center font-semibold text-gray-700">{c._count.orders}</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">${totalRevenue(c).toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{format(new Date(c.createdAt), 'dd MMM yyyy', { locale: es })}</td>
                <td className="px-4 py-3"><div className="flex items-center justify-center gap-2"><button onClick={() => router.push('/inbox')} className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg" title="Ver conversaciones"><MessageSquare size={15} /></button><button onClick={() => router.push('/orders')} className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg" title="Ver pedidos"><ShoppingBag size={15} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
