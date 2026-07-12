'use client';
import Link from 'next/link';
import { ShoppingCart, Wand2 } from 'lucide-react';
import { useCart } from '@/store/cart.store';
import { useEffect, useState } from 'react';
import BrandLogo from '@/components/BrandLogo';

export default function StoreHeader() {
  const count = useCart((s) => s.count());
  // Evita desajuste de hidratación (el carrito vive en localStorage)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/tienda" className="flex items-center gap-2">
          <BrandLogo size={36} />
          <span className="font-bold text-gray-900 text-lg">Relevé</span>
        </Link>
        <div className="flex items-center gap-2">
        <Link
          href="/simulador"
          className="flex items-center gap-1.5 text-teal-700 hover:bg-teal-50 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Wand2 size={17} />
          <span className="hidden sm:inline">Simulador</span>
        </Link>
        <Link
          href="/carrito"
          className="relative flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <ShoppingCart size={18} />
          <span className="hidden sm:inline">Carrito</span>
          {mounted && count > 0 && (
            <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {count}
            </span>
          )}
        </Link>
        </div>
      </div>
    </header>
  );
}
