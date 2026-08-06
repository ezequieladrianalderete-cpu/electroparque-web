import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// No hay cuentas de cliente en la tienda (solo login de admin), así que los favoritos
// se guardan por dispositivo/navegador, igual que el carrito.
interface WishlistStore {
  ids: string[];
  toggle: (productId: string) => void;
  has: (productId: string) => boolean;
}

export const useWishlist = create<WishlistStore>()(persist((set, get) => ({
  ids: [],
  toggle: (productId) => set(s => ({
    ids: s.ids.includes(productId) ? s.ids.filter(id => id !== productId) : [...s.ids, productId],
  })),
  has: (productId) => get().ids.includes(productId),
}), {
  name: 'ep-wishlist-storage',
  storage: createJSONStorage(() => localStorage),
}));
