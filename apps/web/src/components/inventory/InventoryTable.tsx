'use client';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface Item { id: string; quantity: number; minStock: number; variant: { label: string; sku: string; baseProduct: { name: string; category: string } }; }

export default function InventoryTable() {
  const [items, setItems] = useState<Item[]>([]);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [form, setForm] = useState({ type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT', quantity: '', reason: '' });

  async function load() { fetch('/api/inventory').then(r => r.json()).then(setItems).catch(() => {}); }
  useEffect(() => { load(); }, []);

  async function submitMovement() {
    if (!movingId || !form.quantity) return;
    await fetch(`/api/inventory/${movingId}/movement`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, quantity: Number(form.quantity) }) });
    setMovingId(null); setForm({ type: 'IN', quantity: '', reason: '' }); load();
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
          <tr><th className="px-4 py-3 text-left font-medium">Producto</th><th className="px-4 py-3 text-left font-medium">Variante / SKU</th><th className="px-4 py-3 text-center font-medium">Stock</th><th className="px-4 py-3 text-center font-medium">Mínimo</th><th className="px-4 py-3 text-center font-medium">Estado</th><th className="px-4 py-3 text-center font-medium">Acción</th></tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map(item => {
            const isLow = item.quantity <= item.minStock;
            return (
              <>
                <tr key={item.id} className={cn('hover:bg-gray-50', isLow && 'bg-amber-50/40')}>
                  <td className="px-4 py-3 font-medium text-gray-900">{item.variant.baseProduct.name}</td>
                  <td className="px-4 py-3 text-gray-600">{item.variant.label}<span className="ml-2 text-xs text-gray-400">{item.variant.sku}</span></td>
                  <td className={cn('px-4 py-3 text-center font-bold', isLow ? 'text-amber-600' : 'text-gray-900')}>{item.quantity}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{item.minStock}</td>
                  <td className="px-4 py-3 text-center"><span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', isLow ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700')}>{isLow ? '⚠ Bajo' : '✓ OK'}</span></td>
                  <td className="px-4 py-3 text-center"><button onClick={() => setMovingId(movingId === item.id ? null : item.id)} className="text-xs text-teal-600 hover:text-teal-800 font-medium">Registrar</button></td>
                </tr>
                {movingId === item.id && (
                  <tr key={`${item.id}-form`} className="bg-teal-50">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))} className="text-xs border border-teal-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400 bg-white">
                          <option value="IN">📥 Entrada</option><option value="OUT">📤 Salida</option><option value="ADJUSTMENT">🔧 Ajuste</option>
                        </select>
                        <input type="number" min="1" placeholder="Cantidad" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className="w-24 text-xs border border-teal-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400 bg-white" />
                        <input type="text" placeholder="Motivo (opcional)" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="flex-1 min-w-40 text-xs border border-teal-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400 bg-white" />
                        <button onClick={submitMovement} disabled={!form.quantity} className="text-xs bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-medium px-3 py-1.5 rounded-md transition-colors">Confirmar</button>
                        <button onClick={() => setMovingId(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancelar</button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
