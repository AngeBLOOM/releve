'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/store/cart.store';

// Cambia este número por el WhatsApp real del negocio (formato internacional, sin +)
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP ?? '584120846332';

interface Confirmation { orderNumber: string; total: string }

export default function CartCheckout() {
  const items = useCart((s) => s.items);
  const remove = useCart((s) => s.remove);
  const setQuantity = useCart((s) => s.setQuantity);
  const clear = useCart((s) => s.clear);
  const total = useCart((s) => s.total());

  const [form, setForm] = useState({ name: '', phone: '', email: '', deliveryType: 'PICKUP', deliveryAddress: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<Confirmation | null>(null);

  async function updateQty(key: string, item: (typeof items)[number], qty: number) {
    if (qty < 1) return;
    const res = await fetch('/api/shop/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseProductId: item.baseProductId, variantId: item.variantId, sublimationType: item.sublimationType, quantity: qty }),
    });
    if (res.ok) {
      const q = await res.json();
      setQuantity(key, qty, parseFloat(q.unitPrice), parseFloat(q.total));
    } else {
      setQuantity(key, qty, item.unitPrice, item.unitPrice * qty);
    }
  }

  async function submit() {
    setError('');
    if (!form.name.trim()) return setError('Por favor indícanos tu nombre.');
    if (!form.phone.trim()) return setError('Necesitamos un teléfono para coordinar tu pedido.');
    if (form.deliveryType === 'DELIVERY' && !form.deliveryAddress.trim())
      return setError('Indica la dirección de entrega.');
    setSubmitting(true);
    try {
      const res = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: form.name, phone: form.phone, email: form.email },
          items: items.map((i) => ({
            baseProductId: i.baseProductId,
            variantId: i.variantId,
            sublimationType: i.sublimationType,
            quantity: i.quantity,
            customNotes: i.customNotes,
            designUrl: i.designUrl,
            designName: i.designName,
            designMime: i.designMime,
          })),
          deliveryType: form.deliveryType,
          deliveryAddress: form.deliveryAddress,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'No se pudo crear el pedido');
      clear();
      setDone({ orderNumber: data.orderNumber, total: data.total });
    } catch (e: any) {
      setError(e.message ?? 'Error al enviar el pedido');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    const waText = encodeURIComponent(
      `¡Hola! Acabo de hacer el pedido *${done.orderNumber}* por la tienda. Quiero enviarte mi diseño y coordinar el pago. 😊`,
    );
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-4">
        <CheckCircle2 size={56} className="text-green-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900">¡Pedido recibido!</h2>
        <p className="text-gray-600">
          Tu número de pedido es <span className="font-bold text-teal-700">{done.orderNumber}</span>.<br />
          Total: <span className="font-bold">${Number(done.total).toFixed(2)}</span>
        </p>
        <p className="text-sm text-gray-500">
          Ya nos llegó tu pedido y lo estamos procesando. Envíanos tu diseño y coordinamos el adelanto del 50%.
        </p>
        {WHATSAPP_NUMBER && (
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Enviar diseño por WhatsApp
          </a>
        )}
        <div>
          <Link href="/tienda" className="text-teal-600 text-sm hover:underline">← Seguir comprando</Link>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
        <p className="text-gray-500">Tu carrito está vacío.</p>
        <Link href="/tienda" className="inline-block mt-3 text-teal-600 font-medium hover:underline">Explorar productos →</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ítems */}
      <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
        {items.map((i) => (
          <div key={i.key} className="flex items-center gap-3 p-4">
            <div className="w-14 h-14 shrink-0 rounded-lg bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center overflow-hidden">
              {i.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={i.imageUrl} alt={i.productName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">🎨</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{i.productName}</p>
              <p className="text-xs text-gray-500">{i.variantLabel} · {i.sublimationLabel}</p>
              {i.customNotes && <p className="text-xs text-gray-400 italic truncate">“{i.customNotes}”</p>}
              <div className="inline-flex items-center border border-gray-200 rounded-md mt-1.5">
                <button onClick={() => updateQty(i.key, i, i.quantity - 1)} className="px-2 py-0.5 text-gray-500 hover:text-teal-600">−</button>
                <span className="w-8 text-center text-sm">{i.quantity}</span>
                <button onClick={() => updateQty(i.key, i, i.quantity + 1)} className="px-2 py-0.5 text-gray-500 hover:text-teal-600">+</button>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-gray-900">${i.lineTotal.toFixed(2)}</p>
              <button onClick={() => remove(i.key)} className="text-red-400 hover:text-red-600 mt-1"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
        <div className="flex justify-between items-center p-4">
          <span className="text-sm font-medium text-gray-500">Total</span>
          <span className="text-xl font-bold text-gray-900">${total.toFixed(2)}</span>
        </div>
      </div>

      {/* Datos del cliente */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Tus datos</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">WhatsApp / Teléfono *</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Correo (opcional)</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Entrega</label>
            <select value={form.deliveryType} onChange={(e) => setForm({ ...form, deliveryType: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
              <option value="PICKUP">Retiro en tienda</option>
              <option value="DELIVERY">Envío a domicilio</option>
            </select>
          </div>
          {form.deliveryType === 'DELIVERY' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Dirección *</label>
              <input value={form.deliveryAddress} onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Nota para el pedido (opcional)</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {submitting ? (<><Loader2 size={18} className="animate-spin" /> Enviando pedido…</>) : `Confirmar pedido · $${total.toFixed(2)}`}
        </button>
        <p className="text-xs text-gray-400 text-center">Al confirmar, tu pedido llega directo al equipo de Relevé para procesarlo.</p>
      </div>
    </div>
  );
}
