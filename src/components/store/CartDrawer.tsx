'use client';
import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/store/cart';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

export function CartDrawer() {
  const { items, isOpen, toggleCart, removeItem, updateQty, total, count } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/40" onClick={toggleCart} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-lg">Carrito ({count()})</h2>
          <button onClick={toggleCart}><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <p className="text-center text-gray-400 py-10">Tu carrito está vacío</p>
          ) : items.map((item, i) => (
            <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center text-2xl border">📦</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{item.product.name}</p>
                {item.variant && <p className="text-xs text-gray-500">{item.variant.name}: {item.variant.value}</p>}
                <p className="text-sm font-bold text-ep-navy mt-1">{formatPrice(item.product.price)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button onClick={()=>updateQty(item.product.id, item.quantity-1, item.variant?.id)} className="p-1 border rounded"><Minus className="w-3 h-3"/></button>
                  <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                  <button onClick={()=>updateQty(item.product.id, item.quantity+1, item.variant?.id)} className="p-1 border rounded"><Plus className="w-3 h-3"/></button>
                  <button onClick={()=>removeItem(item.product.id, item.variant?.id)} className="ml-auto p-1 text-red-500"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="p-4 border-t space-y-3">
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span><span className="text-ep-navy">{formatPrice(total())}</span>
            </div>
            <Link href="/checkout" onClick={toggleCart} className="block w-full bg-ep-red hover:bg-ep-red-dark text-white font-bold py-3 rounded-xl text-center transition-colors">
              Finalizar compra
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
