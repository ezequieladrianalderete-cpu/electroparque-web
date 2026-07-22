'use client';
import { useState } from 'react';
import { ShoppingCart, MessageCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/store/cart';
import type { Product, Review } from '@/types';

export function ProductInfo({ product, reviews, avgRating }: { product: Product; reviews: Review[]; avgRating: string | null }) {
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]?.id || '');
  const [qty, setQty] = useState(1);
  const variant = product.variants?.find(v => v.id === selectedVariant);
  const finalPrice = product.price + (variant?.price_modifier || 0);
  const discount = product.compare_at_price ? Math.round((1 - product.price / product.compare_at_price) * 100) : 0;
  const savings = product.compare_at_price ? product.compare_at_price - product.price : 0;

  return (
    <div className="space-y-5">
      {product.category && <span className="text-ep-red text-xs font-bold uppercase tracking-wide">{product.category.name}</span>}
      <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{product.name}</h1>

      {avgRating && (
        <div className="flex items-center gap-2">
          <span className="text-yellow-400">{'★'.repeat(Math.round(parseFloat(avgRating)))}</span>
          <span className="font-bold text-sm">{avgRating}</span>
          <span className="text-gray-400 text-sm">({reviews.length} opiniones)</span>
        </div>
      )}

      <div className="bg-gray-50 rounded-xl p-4 border flex flex-wrap items-end gap-3">
        <span className="text-3xl font-extrabold text-ep-navy">{formatPrice(finalPrice)}</span>
        {product.compare_at_price && <span className="text-lg text-gray-400 line-through">{formatPrice(product.compare_at_price)}</span>}
        {discount > 0 && <span className="bg-ep-red text-white text-xs font-bold px-2.5 py-1 rounded-full">-{discount}% · Ahorrás {formatPrice(savings)}</span>}
      </div>

      {product.variants && product.variants.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2">Color:</p>
          <div className="flex gap-2 flex-wrap">
            {product.variants.map(v => (
              <button key={v.id} onClick={() => setSelectedVariant(v.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${selectedVariant === v.id ? 'border-ep-navy bg-blue-50 text-ep-navy' : 'border-gray-200 text-gray-600'}`}>
                {v.value}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex items-center border-2 rounded-xl overflow-hidden">
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 text-lg">−</button>
          <span className="px-4 font-bold border-x">{qty}</span>
          <button onClick={() => setQty(qty + 1)} className="px-3 py-2 text-lg">+</button>
        </div>
        <button onClick={() => { for (let i = 0; i < qty; i++) addItem(product, variant); }}
          className="flex-1 bg-ep-red hover:bg-ep-red-dark text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
          <ShoppingCart className="w-5 h-5" /> Agregar al carrito
        </button>
      </div>

      <a href="https://wa.me/541138848412" target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full border-2 border-green-500 text-green-600 font-semibold py-3 rounded-xl hover:bg-green-50 transition-colors">
        <MessageCircle className="w-5 h-5" /> Consultar por WhatsApp
      </a>

      <div className="grid grid-cols-3 gap-2">
        {[['🚚','Envío a todo el país'],['🛡️','Garantía 12 meses'],['💬','Soporte WhatsApp']].map(([icon,text])=>(
          <div key={text} className="text-center p-3 bg-gray-50 rounded-xl border text-xs">
            <span className="text-xl block mb-1">{icon}</span><span className="font-medium text-gray-700">{text}</span>
          </div>
        ))}
      </div>

      {product.specs && Object.keys(product.specs).length > 0 && (
        <div className="border rounded-xl overflow-hidden">
          <div className="bg-ep-navy text-white px-4 py-2 font-bold text-sm">Especificaciones</div>
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(product.specs).map(([k, v], i) => (
                <tr key={k} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-2 text-gray-500 font-medium">{k}</td>
                  <td className="px-4 py-2 text-gray-900">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {product.short_description && <p className="text-gray-500 text-sm leading-relaxed">{product.short_description}</p>}
    </div>
  );
}
