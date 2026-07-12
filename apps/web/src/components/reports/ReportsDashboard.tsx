'use client';
import { useEffect, useState } from 'react';
import { ShoppingBag, DollarSign, Users, Clock, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';
import { cn, formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

type Period = '7d' | '30d' | '90d';
const PERIOD_LABELS: Record<Period, string> = { '7d': '7 días', '30d': '30 días', '90d': '90 días' };
const COLORS = ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];
const CH_COLORS: Record<string, string> = { WHATSAPP: '#25d366', INSTAGRAM: '#e1306c', MESSENGER: '#0084ff' };
const CH_LABELS: Record<string, string> = { WHATSAPP: '📱 WhatsApp', INSTAGRAM: '📸 Instagram', MESSENGER: '💬 Messenger' };

function StatCard({ icon, label, value, bg, alert = false }: { icon: React.ReactNode; label: string; value: string | number; bg: string; alert?: boolean; }) {
  return (
    <div className={cn(bg, 'rounded-xl p-4 border', alert ? 'border-red-200' : 'border-transparent')}>
      <div className="flex items-center gap-3"><div className="p-2 bg-white rounded-lg shadow-sm shrink-0">{icon}</div><div><p className="text-xs text-gray-500 font-medium">{label}</p><p className="text-xl font-bold text-gray-900">{value}</p></div></div>
    </div>
  );
}

export default function ReportsDashboard() {
  const [period, setPeriod] = useState<Period>('30d');
  const [stats, setStats] = useState<any>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [channelData, setChannelData] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/reports/dashboard?period=${period}`).then(r => r.json()).then(setStats).catch(() => {});
    fetch(`/api/reports/sales-by-day?period=${period}`).then(r => r.json()).then(setSalesData).catch(() => {});
    fetch('/api/reports/top-products?limit=5').then(r => r.json()).then(setTopProducts).catch(() => {});
    fetch('/api/reports/orders-by-channel').then(r => r.json()).then(d => setChannelData(d.map((x: any) => ({ name: CH_LABELS[x.channel] ?? x.channel, value: x.count, color: CH_COLORS[x.channel] ?? '#9ca3af' })))).catch(() => {});
  }, [period]);

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={cn('px-4 py-1.5 text-sm rounded-lg font-medium transition-colors', period === p ? 'bg-teal-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}>{PERIOD_LABELS[p]}</button>
        ))}
      </div>
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={<ShoppingBag size={20} className="text-teal-600" />} label="Pedidos" value={stats.totalOrders} bg="bg-teal-50" />
          <StatCard icon={<DollarSign size={20} className="text-green-600" />} label="Ingresos" value={formatCurrency(stats.totalRevenue)} bg="bg-green-50" />
          <StatCard icon={<Users size={20} className="text-blue-600" />} label="Nuevos clientes" value={stats.newCustomers} bg="bg-blue-50" />
          <StatCard icon={<Clock size={20} className="text-amber-600" />} label="En producción" value={stats.pendingOrders} bg="bg-amber-50" />
          <StatCard icon={<AlertTriangle size={20} className="text-red-500" />} label="Stock bajo" value={stats.lowStock} bg="bg-red-50" alert={stats.lowStock > 0} />
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Ventas por día</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={salesData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} /><stop offset="95%" stopColor="#7c3aed" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tickFormatter={d => { try { return format(parseISO(d), 'dd MMM', { locale: es }); } catch { return d; } }} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={50} />
              <Tooltip formatter={(v: number) => [`$${Number(v).toFixed(2)}`, 'Ventas']} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="total" stroke="#7c3aed" strokeWidth={2} fill="url(#sg)" dot={false} activeDot={{ r: 5, fill: '#7c3aed' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Pedidos por canal</h3>
          {channelData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={channelData} cx="50%" cy="45%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {channelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [v, 'Pedidos']} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Legend formatter={value => <span style={{ fontSize: '11px' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-xs text-gray-400 text-center py-16">Sin datos aún</p>}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Productos más vendidos</h3>
        {topProducts.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="quantity" radius={[0, 4, 4, 0]} name="Unidades">{topProducts.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="text-xs text-gray-400 text-center py-10">Sin datos aún</p>}
      </div>
    </div>
  );
}
