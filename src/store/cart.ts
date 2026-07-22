import { create } from 'zustand';
import type { Product, ProductVariant } from '@/types';

interface CartItem { product: Product; variant?: ProductVariant; quantity: number; }
interface CartStore {
  items: CartItem[]; isOpen: boolean;
  addItem: (product: Product, variant?: ProductVariant) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQty: (productId: string, qty: number, variantId?: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  total: () => number;
  count: () => number;
}

export const useCart = create<CartStore>((set, get) => ({
  items: [], isOpen: false,
  addItem: (product, variant) => set(s => {
    const key = product.id + (variant?.id || '');
    const existing = s.items.find(i => i.product.id + (i.variant?.id || '') === key);
    if (existing) return { items: s.items.map(i => i.product.id + (i.variant?.id || '') === key ? { ...i, quantity: i.quantity + 1 } : i), isOpen: true };
    return { items: [...s.items, { product, variant, quantity: 1 }], isOpen: true };
  }),
  removeItem: (pid, vid) => set(s => ({ items: s.items.filter(i => !(i.product.id === pid && (i.variant?.id || '') === (vid || ''))) })),
  updateQty: (pid, qty, vid) => set(s => ({ items: qty <= 0 ? s.items.filter(i => !(i.product.id === pid)) : s.items.map(i => i.product.id === pid && (i.variant?.id || '') === (vid || '') ? { ...i, quantity: qty } : i) })),
  clearCart: () => set({ items: [] }),
  toggleCart: () => set(s => ({ isOpen: !s.isOpen })),
  total: () => get().items.reduce((t, i) => t + (i.product.price + (i.variant?.price_modifier || 0)) * i.quantity, 0),
  count: () => get().items.reduce((t, i) => t + i.quantity, 0),
}));
