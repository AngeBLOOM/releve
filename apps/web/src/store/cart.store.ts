'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  /** clave única de línea (producto+variante+sublimación) */
  key: string;
  baseProductId: string;
  productName: string;
  imageUrl?: string | null;
  variantId: string;
  variantLabel: string;
  sublimationType: string;
  sublimationLabel: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  customNotes?: string;
  designUrl?: string;
  designName?: string;
  designMime?: string;
}

interface CartState {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (key: string) => void;
  setQuantity: (key: string, quantity: number, unitPrice: number, lineTotal: number) => void;
  clear: () => void;
  count: () => number;
  total: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((s) => {
          const existing = s.items.find((i) => i.key === item.key);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.key === item.key
                  ? { ...i, quantity: item.quantity, unitPrice: item.unitPrice, lineTotal: item.lineTotal, customNotes: item.customNotes }
                  : i,
              ),
            };
          }
          return { items: [...s.items, item] };
        }),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      setQuantity: (key, quantity, unitPrice, lineTotal) =>
        set((s) => ({
          items: s.items.map((i) => (i.key === key ? { ...i, quantity, unitPrice, lineTotal } : i)),
        })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((n, i) => n + i.quantity, 0),
      total: () => get().items.reduce((n, i) => n + i.lineTotal, 0),
    }),
    { name: 'sublicolor-cart' },
  ),
);

export const CATEGORY_LABEL: Record<string, string> = {
  MUG: '☕ Tazas',
  SHIRT: '👕 Franelas',
  SWEATER: '🧥 Suéteres',
  CAP: '🧢 Gorras',
  PEN: '🖊️ Bolígrafos',
  SPORTSWEAR: '🏅 Ropa deportiva',
  OTHER: '✨ Otros',
};

export const SUBLIM_LABEL: Record<string, string> = {
  LOGO_SMALL: 'Logo pequeño',
  HALF_FRONT: 'Media frente',
  FULL_FRONT: 'Frente completa',
  FULL_FRONT_BACK: 'Frente + dorso',
  A4: 'Tamaño A4',
  A3: 'Tamaño A3',
};
