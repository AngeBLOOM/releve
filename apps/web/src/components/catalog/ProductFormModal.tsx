'use client';
import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

interface Props { product: any; onClose: () => void; onSaved: () => void; }
const CATEGORIES = [{ value: 'SHIRT', label: '👕 Franela' }, { value: 'MUG', label: '☕ Taza' }, { value: 'OTHER', label: '📦 Otro' }];

export default function ProductFormModal({ product, onClose, onSaved }: Props) {
  const isEdit = !!product;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: product?.name ?? '', category: product?.category ?? 'SHIRT', description: product?.description ?? '' });
  const [variants, setVariants] = useState(product?.variants?.map((v: any) => ({ sku: v.sku, label: v.label, size: v.size ?? '', color: v.color ?? '', costPrice: String(v.costPrice) })) ?? [{ sku: '', label: '', size: '', color: '', costPrice: '' }]);

  function addVariant() { setVariants((v: any[]) => [...v, { sku: '', label: '', size: '', color: '', costPrice: '' }]); }
  function removeVariant(i: number) { setVariants((v: any[]) => v.filter((_: any, idx: number) => idx !== i)); }
  function updateVariant(i: number, key: string, value: string) { setVariants((v: any[]) => v.map((item: any, idx: number) => idx === i ? { ...item, [key]: value } : item)); }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    const url = isEdit ? `/api/catalog/products/${product.id}` : '/api/catalog/products';
    await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, variants: isEdit ? undefined : variants.map((v: any) => ({ ...v, costPrice: parseFloat(v.costPrice) || 0 })) }) });
    setSaving(false); onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{isEdit ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label><input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" placeholder="Franela Algodón" /></div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label><select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">{CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
          </div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label><textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" /></div>
          {!isEdit && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-600 uppercase">Variantes</label>
                <button onClick={addVariant} className="flex items-center gap-1 text-xs text-teal-600 font-medium"><Plus size={13} /> Agregar</button>
              </div>
              {variants.map((v: any, i: number) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2 mb-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input placeholder="SKU" value={v.sku} onChange={e => updateVariant(i, 'sku', e.target.value)} className="border border-gray-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400" />
                    <input placeholder="Etiqueta (Talla M - Blanca)" value={v.label} onChange={e => updateVariant(i, 'label', e.target.value)} className="border border-gray-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400" />
                    <input placeholder="Talla" value={v.size} onChange={e => updateVariant(i, 'size', e.target.value)} className="border border-gray-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400" />
                    <input placeholder="Color" value={v.color} onChange={e => updateVariant(i, 'color', e.target.value)} className="border border-gray-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="Costo base ($)" value={v.costPrice} onChange={e => updateVariant(i, 'costPrice', e.target.value)} className="w-32 border border-gray-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-teal-400" />
                    {variants.length > 1 && <button onClick={() => removeVariant(i)} className="ml-auto text-red-400 hover:text-red-600"><Trash2 size={14} /></button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium py-2 rounded-lg transition-colors">Cancelar</button>
          <button onClick={save} disabled={saving || !form.name.trim()} className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-sm font-medium py-2 rounded-lg transition-colors">{saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}</button>
        </div>
      </div>
    </div>
  );
}
