'use client';
import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Alert { id: string; quantity: number; minStock: number; variant: { label: string; baseProduct: { name: string } } }

export default function LowStockBanner() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  useEffect(() => { fetch('/api/inventory/alerts').then(r => r.json()).then(setAlerts).catch(() => {}); }, []);
  if (!alerts.length) return null;
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
      <div className="flex items-center gap-2 mb-2"><AlertTriangle size={16} className="text-amber-600" /><span className="text-sm font-semibold text-amber-800">Stock bajo en {alerts.length} producto(s)</span></div>
      <ul className="space-y-1">{alerts.map(a => <li key={a.id} className="text-xs text-amber-700">• <strong>{a.variant.baseProduct.name}</strong> — {a.variant.label}: <span className="font-bold">{a.quantity}</span> unidades (mínimo: {a.minStock})</li>)}</ul>
    </div>
  );
}
