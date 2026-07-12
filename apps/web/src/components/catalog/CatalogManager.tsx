'use client';
import { useEffect, useState } from 'react';
import { Plus, Pencil, ToggleLeft, ToggleRight, ChevronDown, Upload, Trash2, Loader2 } from 'lucide-react';
import ProductFormModal from './ProductFormModal';
import PricingRulesPanel from './PricingRulesPanel';
import { cn } from '@/lib/utils';

const CATEGORY_LABEL: Record<string, string> = { MUG: '☕ Tazas', SHIRT: '👕 Franelas', SWEATER: '🧥 Suéteres', CAP: '🧢 Gorras', PEN: '🖊️ Bolígrafos', SPORTSWEAR: '🏅 Deportivo', OTHER: '📦 Otros' };

interface Product { id: string; name: string; category: string; isActive: boolean; imageUrl: string | null; variants: Array<{ id: string; label: string; sku: string }>; pricingRules: Array<{ id: string; sublimationType: string; minQuantity: number; maxQuantity: number | null; unitPrice: string }>; }

export default function CatalogManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  async function load() { setLoading(true); const res = await fetch('/api/catalog/products'); setProducts(await res.json()); setLoading(false); }
  useEffect(() => { load(); }, []);

  async function toggleActive(id: string) { await fetch(`/api/catalog/products/${id}/toggle`, { method: 'PATCH' }); load(); }

  async function uploadImage(id: string, file: File) {
    setUploadingId(id);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/shop/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const d = await res.json();
        await fetch(`/api/catalog/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageUrl: d.url }) });
        await load();
      } else {
        const e = await res.json().catch(() => ({}));
        alert(e.message ?? 'No se pudo subir la imagen');
      }
    } finally {
      setUploadingId(null);
    }
  }

  async function removeImage(id: string) {
    if (!confirm('¿Quitar la imagen de este producto?')) return;
    await fetch(`/api/catalog/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageUrl: null }) });
    load();
  }

  const grouped = products.reduce<Record<string, Product[]>>((acc, p) => { acc[p.category] = [...(acc[p.category] ?? []), p]; return acc; }, {});

  if (loading) return <p className="text-gray-400 text-sm">Cargando catálogo...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Nuevo producto
        </button>
      </div>
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{CATEGORY_LABEL[category] ?? category}</h2>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {items.map(product => (
              <div key={product.id}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => setExpanded(expanded === product.id ? null : product.id)} className="flex-1 flex items-center gap-3 text-left">
                    <ChevronDown size={16} className={cn('text-gray-400 transition-transform shrink-0', expanded === product.id && 'rotate-180')} />
                    <div>
                      <span className="text-sm font-medium text-gray-900">{product.name}</span>
                      <span className="ml-2 text-xs text-gray-400">{product.variants.length} variante(s) · {product.pricingRules.length} regla(s)</span>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleActive(product.id)} className={cn('transition-colors', product.isActive ? 'text-green-500' : 'text-gray-300')}>
                      {product.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                    </button>
                    <button onClick={() => { setEditing(product); setShowModal(true); }} className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"><Pencil size={15} /></button>
                  </div>
                </div>
                {expanded === product.id && (
                  <div className="px-4 pb-4 space-y-4 border-t border-gray-100 bg-gray-50">
                    <div className="pt-3">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Imagen</h4>
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-20 rounded-lg border border-gray-200 bg-white overflow-hidden flex items-center justify-center shrink-0">
                          {product.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl text-gray-300">🖼️</span>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg cursor-pointer w-fit">
                            {uploadingId === product.id ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                            {product.imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
                            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploadingId === product.id}
                              onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(product.id, f); e.currentTarget.value = ''; }} />
                          </label>
                          {product.imageUrl && (
                            <button onClick={() => removeImage(product.id)} className="flex items-center gap-2 text-xs font-medium text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg w-fit">
                              <Trash2 size={13} /> Quitar imagen
                            </button>
                          )}
                          <span className="text-[11px] text-gray-400">PNG/JPG, máx 10 MB</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Variantes</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.variants.map(v => <span key={v.id} className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1 text-gray-700">{v.label} <span className="text-gray-400">· {v.sku}</span></span>)}
                      </div>
                    </div>
                    <PricingRulesPanel productId={product.id} rules={product.pricingRules} onUpdate={load} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      {showModal && <ProductFormModal product={editing} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}
