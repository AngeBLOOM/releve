'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2, Upload } from 'lucide-react';
import { useCart, CATEGORY_LABEL, SUBLIM_LABEL } from '@/store/cart.store';
import { uploadDesignFile } from '@/lib/upload';

interface Variant { id: string; label: string; size: string | null; color: string | null; stockItems: { quantity: number }[] }
interface PricingRule { sublimationType: string; minQuantity: number; maxQuantity: number | null; unitPrice: string }
interface Product {
  id: string;
  name: string;
  category: string;
  description: string | null;
  imageUrl: string | null;
  variants: Variant[];
  pricingRules: PricingRule[];
}

interface Quote { unitPrice: string; subtotal: string; discount: string; total: string; breakdown: string }

export default function ProductCustomizer({ id }: { id: string }) {
  const router = useRouter();
  const add = useCart((s) => s.add);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [variantId, setVariantId] = useState('');
  const [sublimationType, setSublimationType] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [added, setAdded] = useState(false);
  const [design, setDesign] = useState<{ url: string; name: string; mime: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  async function uploadDesign(file: File) {
    setUploading(true);
    setAdded(false);
    try {
      const d = await uploadDesignFile(file);
      setDesign({ url: d.url, name: d.name, mime: d.mime });
    } catch (e: any) {
      alert(e.message ?? 'No se pudo subir el archivo');
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    fetch(`/api/shop/products/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((p: Product) => {
        setProduct(p);
        setVariantId(p.variants[0]?.id ?? '');
        const types = Array.from(new Set(p.pricingRules.map((r) => r.sublimationType)));
        setSublimationType(types[0] ?? '');
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  // Tipos de sublimación disponibles según las reglas de precio
  const sublimTypes = useMemo(
    () => (product ? Array.from(new Set(product.pricingRules.map((r) => r.sublimationType))) : []),
    [product],
  );

  // Cotización en vivo (recalculada en el servidor)
  useEffect(() => {
    if (!product || !variantId || !sublimationType || quantity < 1) return;
    setQuoting(true);
    setAdded(false);
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch('/api/shop/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseProductId: product.id, variantId, sublimationType, quantity }),
        signal: ctrl.signal,
      })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((q: Quote) => setQuote(q))
        .catch(() => setQuote(null))
        .finally(() => setQuoting(false));
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [product, variantId, sublimationType, quantity]);

  function addToCart() {
    if (!product || !quote) return;
    const variant = product.variants.find((v) => v.id === variantId)!;
    add({
      key: `${product.id}_${variantId}_${sublimationType}`,
      baseProductId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl,
      variantId,
      variantLabel: variant.label,
      sublimationType,
      sublimationLabel: SUBLIM_LABEL[sublimationType] ?? sublimationType,
      quantity,
      unitPrice: parseFloat(quote.unitPrice),
      lineTotal: parseFloat(quote.total),
      customNotes: notes.trim() || undefined,
      designUrl: design?.url,
      designName: design?.name,
      designMime: design?.mime,
    });
    setAdded(true);
  }

  if (loading) return <p className="text-center text-gray-400 py-12">Cargando…</p>;
  if (notFound || !product)
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Producto no disponible.</p>
        <Link href="/tienda" className="text-teal-600 text-sm mt-2 inline-block">← Volver a la tienda</Link>
      </div>
    );

  const emoji = (CATEGORY_LABEL[product.category] ?? '✨').split(' ')[0];

  return (
    <div>
      <Link href="/tienda" className="inline-flex items-center gap-1 text-sm text-gray-200 hover:text-white mb-4">
        <ArrowLeft size={16} /> Volver
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Imagen */}
        <div className="aspect-square bg-gradient-to-br from-teal-50 to-cyan-100 rounded-2xl flex items-center justify-center overflow-hidden">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-8xl">{emoji}</span>
          )}
        </div>

        {/* Personalizador */}
        <div className="space-y-5 bg-white rounded-2xl border border-gray-200 p-5 shadow-sm self-start">
          <div>
            <p className="text-sm text-teal-500 font-medium">{CATEGORY_LABEL[product.category] ?? product.category}</p>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            {product.description && <p className="text-gray-500 text-sm mt-2">{product.description}</p>}
          </div>

          {/* Variante */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Modelo / variante</label>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVariantId(v.id)}
                  className={`text-sm px-3 py-2 rounded-lg border transition-colors ${
                    variantId === v.id
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de sublimación */}
          {sublimTypes.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de estampado</label>
              <div className="flex flex-wrap gap-2">
                {sublimTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSublimationType(t)}
                    className={`text-sm px-3 py-2 rounded-lg border transition-colors ${
                      sublimationType === t
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300'
                    }`}
                  >
                    {SUBLIM_LABEL[t] ?? t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cantidad */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Cantidad</label>
            <div className="inline-flex items-center border border-gray-200 rounded-lg">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-2 text-gray-500 hover:text-teal-600">−</button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center text-sm py-2 focus:outline-none"
              />
              <button onClick={() => setQuantity((q) => q + 1)} className="px-3 py-2 text-gray-500 hover:text-teal-600">+</button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Descuentos por volumen automáticos (10+, 20+, 50+ unidades).</p>
          </div>

          {/* Notas de diseño */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Describe tu diseño (opcional)</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: logo de mi equipo en el centro, colores azul y blanco, nombre 'Carlos' atrás…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">O sube tu diseño aquí abajo 👇 (también puedes enviárnoslo luego por WhatsApp).</p>
          </div>

          {/* Subir diseño */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sube tu diseño (opcional)</label>
            {design ? (
              <div className="flex items-center gap-3 border border-teal-200 bg-teal-50 rounded-lg p-2">
                {design.mime.startsWith('image/') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={design.url} alt={design.name} className="w-12 h-12 object-cover rounded" />
                ) : (
                  <span className="text-2xl">📄</span>
                )}
                <span className="text-xs text-gray-600 flex-1 truncate">{design.name}</span>
                <button onClick={() => setDesign(null)} className="text-red-400 hover:text-red-600 text-xs font-medium">Quitar</button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-lg py-3 text-sm text-gray-500 cursor-pointer hover:border-teal-300 hover:text-teal-600 transition-colors">
                {uploading ? (<><Loader2 size={15} className="animate-spin" /> Subiendo…</>) : (<><Upload size={15} /> Elegir archivo (PNG, JPG o PDF)</>)}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,application/pdf" className="hidden" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDesign(f); }} />
              </label>
            )}
            <p className="text-xs text-gray-400 mt-1">Máx 10 MB. Ideal: PNG con fondo transparente, 300 DPI.</p>
          </div>

          {/* Precio + acción */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            {quoting ? (
              <p className="text-sm text-gray-400 flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Calculando precio…</p>
            ) : quote ? (
              <div className="space-y-1 mb-3 text-sm">
                <div className="flex justify-between text-gray-500"><span>Precio unitario</span><span>${parseFloat(quote.unitPrice).toFixed(2)}</span></div>
                {parseFloat(quote.discount) > 0 && (
                  <div className="flex justify-between text-green-600"><span>Descuento por volumen</span><span>−${parseFloat(quote.discount).toFixed(2)}</span></div>
                )}
                <div className="flex justify-between font-bold text-gray-900 text-base pt-1"><span>Total</span><span>${parseFloat(quote.total).toFixed(2)}</span></div>
              </div>
            ) : (
              <p className="text-sm text-amber-600 mb-3">No hay precio configurado para esta combinación. Escríbenos y te cotizamos.</p>
            )}

            <button
              onClick={addToCart}
              disabled={!quote || quoting}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              {added ? (<><Check size={18} /> Agregado al carrito</>) : 'Agregar al carrito'}
            </button>
            {added && (
              <button onClick={() => router.push('/carrito')} className="w-full text-teal-600 text-sm font-medium mt-2 hover:underline">
                Ir al carrito →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
