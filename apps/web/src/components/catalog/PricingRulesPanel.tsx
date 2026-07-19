'use client';
import { useState } from 'react';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';

const SUBLIM_LABELS: Record<string, string> = { LOGO_SMALL: 'Logo pequeño', HALF_FRONT: 'Media frente', FULL_FRONT: 'Frente completa', FULL_FRONT_BACK: 'Frente + dorso', A4: 'Taza A4', A3: 'Tamaño A3' };
interface Rule { id: string; sublimationType: string; minQuantity: number; maxQuantity: number | null; unitPrice: string; }
interface Props { productId: string; rules: Rule[]; onUpdate: () => void; }
const EMPTY = { sublimationType: 'FULL_FRONT', minQuantity: 1, maxQuantity: '', unitPrice: '' };

export default function PricingRulesPanel({ productId, rules, onUpdate }: Props) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');

  async function saveRule() {
    if (!form.unitPrice) return;
    setSaving(true);
    await fetch(`/api/catalog/products/${productId}/pricing`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, minQuantity: Number(form.minQuantity), maxQuantity: form.maxQuantity ? Number(form.maxQuantity) : null, unitPrice: parseFloat(form.unitPrice) }) });
    setSaving(false); setAdding(false); setForm(EMPTY); onUpdate();
  }

  async function deleteRule(ruleId: string) {
    if (!confirm('¿Eliminar esta regla?')) return;
    await fetch(`/api/catalog/pricing/${ruleId}`, { method: 'DELETE' }); onUpdate();
  }

  // Editar el precio directamente en la tabla
  async function savePrice(ruleId: string) {
    const value = parseFloat(editPrice);
    if (isNaN(value) || value < 0) return;
    setSaving(true);
    await fetch(`/api/catalog/pricing/${ruleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unitPrice: value }),
    });
    setSaving(false); setEditingId(null); onUpdate();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-gray-500 uppercase">Precios</h4>
        <button onClick={() => setAdding(!adding)} className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-800 font-medium"><Plus size={13} /> Agregar</button>
      </div>
      {rules.length > 0 && (
        <div className="rounded-lg overflow-hidden border border-gray-200 bg-white mb-2">
          <table className="w-full text-xs">
            <thead><tr className="bg-gray-50 text-gray-500 uppercase"><th className="px-3 py-2 text-left font-medium">Tipo</th><th className="px-3 py-2 text-left font-medium">Mín</th><th className="px-3 py-2 text-left font-medium">Máx</th><th className="px-3 py-2 text-right font-medium">Precio</th><th className="px-3 py-2"></th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {rules.map(rule => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-700 font-medium">{SUBLIM_LABELS[rule.sublimationType] ?? rule.sublimationType}</td>
                  <td className="px-3 py-2 text-gray-600">{rule.minQuantity}</td>
                  <td className="px-3 py-2 text-gray-600">{rule.maxQuantity ?? '∞'}</td>
                  <td className="px-3 py-2 text-right">
                    {editingId === rule.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-gray-500">$</span>
                        <input
                          type="number" step="0.01" min="0" autoFocus
                          value={editPrice}
                          onChange={e => setEditPrice(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') savePrice(rule.id); if (e.key === 'Escape') setEditingId(null); }}
                          className="w-20 text-xs text-right border border-teal-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-400"
                        />
                        <button onClick={() => savePrice(rule.id)} disabled={saving} title="Guardar"
                          className="text-green-600 hover:text-green-700 disabled:opacity-40 p-1"><Check size={14} /></button>
                        <button onClick={() => setEditingId(null)} title="Cancelar"
                          className="text-gray-400 hover:text-gray-600 p-1"><X size={14} /></button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingId(rule.id); setEditPrice(parseFloat(rule.unitPrice).toFixed(2)); }}
                        title="Clic para cambiar el precio"
                        className="group inline-flex items-center gap-1.5 font-bold text-gray-900 hover:text-teal-700"
                      >
                        ${parseFloat(rule.unitPrice).toFixed(2)}
                        <Pencil size={12} className="text-gray-300 group-hover:text-teal-600" />
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right"><button onClick={() => deleteRule(rule.id)} className="text-red-400 hover:text-red-600"><Trash2 size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {adding && (
        <div className="bg-white border border-teal-200 rounded-lg p-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-xs text-gray-500 mb-1">Tipo</label>
              <select value={form.sublimationType} onChange={e => setForm(f => ({ ...f, sublimationType: e.target.value }))} className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400">
                {Object.entries(SUBLIM_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
            <div><label className="block text-xs text-gray-500 mb-1">Precio/u ($)</label><input type="number" step="0.01" min="0" placeholder="0.00" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Cant. mínima</label><input type="number" min="1" value={form.minQuantity} onChange={e => setForm(f => ({ ...f, minQuantity: e.target.value as any }))} className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Cant. máxima (∞)</label><input type="number" min="1" placeholder="sin límite" value={form.maxQuantity} onChange={e => setForm(f => ({ ...f, maxQuantity: e.target.value as any }))} className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-400" /></div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAdding(false)} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-md">Cancelar</button>
            <button onClick={saveRule} disabled={saving || !form.unitPrice} className="text-xs bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white font-medium px-4 py-1.5 rounded-md transition-colors">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
