'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CATEGORY_LABEL } from '@/store/cart.store';

interface Variant { id: string; stockItems: { quantity: number }[] }
interface PricingRule { unitPrice: string }
interface Product {
  id: string;
  name: string;
  category: string;
  description: string | null;
  imageUrl: string | null;
  variants: Variant[];
  pricingRules: PricingRule[];
}

function fromPrice(p: Product): number | null {
  if (!p.pricingRules.length) return null;
  return Math.min(...p.pricingRules.map((r) => parseFloat(r.unitPrice)));
}

export default function StoreCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    fetch('/api/shop/products')
      .then((r) => r.json())
      .then((d) => setProducts(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => ['ALL', ...Array.from(new Set(products.map((p) => p.category)))],
    [products],
  );
  const visible = filter === 'ALL' ? products : products.filter((p) => p.category === filter);

  if (loading) return <p className="text-center text-gray-400">Cargando catálogo…</p>;
  if (!products.length)
    return <p className="text-center text-gray-400">Aún no hay productos publicados. Vuelve pronto 💜</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
              filter === c
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
            }`}
          >
            {c === 'ALL' ? '🛍️ Todo' : CATEGORY_LABEL[c] ?? c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {visible.map((p) => {
          const price = fromPrice(p);
          const stock = p.variants.reduce((n, v) => n + v.stockItems.reduce((s, i) => s + i.quantity, 0), 0);
          return (
            <Link
              key={p.id}
              href={`/tienda/${p.id}`}
              className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-teal-200 transition-all"
            >
              <div className="relative aspect-square bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center overflow-hidden">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <span className="text-5xl">{(CATEGORY_LABEL[p.category] ?? '✨').split(' ')[0]}</span>
                )}
                {/* Sello de marca (estilo publicidad) */}
                <span className="absolute top-2 left-2 flex items-center gap-1 bg-white/85 backdrop-blur px-2 py-0.5 rounded-full text-[11px] font-bold text-gray-800 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="" className="w-4 h-4 rounded-full object-cover" /> Relevé
                </span>
                {/* Precio destacado (estilo publicidad) */}
                <span className="absolute bottom-2 right-2 bg-teal-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                  {price != null ? `$${price.toFixed(2)}` : 'Consultar'}
                </span>
              </div>
              <div className="p-3">
                <p className="text-xs text-teal-500 font-medium">{CATEGORY_LABEL[p.category] ?? p.category}</p>
                <h3 className="text-sm font-semibold text-gray-900 leading-tight mt-0.5 line-clamp-2">{p.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-gray-900">
                    {price != null ? `Desde $${price.toFixed(2)}` : 'Consultar'}
                  </span>
                  {stock > 0 ? (
                    <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">En stock</span>
                  ) : (
                    <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Bajo pedido</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
