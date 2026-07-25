'use client';
import { useState } from 'react';
import { ShoppingCart, Zap, MessageCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/store/cart';
import { useRouter } from 'next/navigation';
import type { Product, Review } from '@/types';

export function ProductInfo({ product, reviews, avgRating }: { product: Product; reviews: Review[]; avgRating: string | null }) {
  const { addItem, buyNow } = useCart();
  const router = useRouter();
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]?.id || '');
  const [qty, setQty] = useState(1);
  const variant = product.variants?.find(v => v.id === selectedVariant);
  const finalPrice = product.price + (variant?.price_modifier || 0);
  const discount = product.compare_at_price ? Math.round((1 - product.price / product.compare_at_price) * 100) : 0;
  const savings = product.compare_at_price ? product.compare_at_price - product.price : 0;

  const handleBuyNow = () => { buyNow(product, variant, qty); router.push('/checkout'); };

  return (
    <div className="space-y-5">
      {product.category && <span className="text-ep-red text-xs font-bold uppercase tracking-wider animate-pulse">{product.category.name}</span>}
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">{product.name}</h1>

      {avgRating && (
        <div className="flex items-center gap-2">
          <span className="text-yellow-400">{'★'.repeat(Math.round(parseFloat(avgRating)))}</span>
          <span className="font-bold text-sm">{avgRating}</span>
          <span className="text-gray-400 text-sm">({reviews.length} opiniones)</span>
        </div>
      )}

      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-5 border flex flex-wrap items-end gap-3">
        <span className="text-3xl font-extrabold bg-gradient-to-r from-ep-navy to-blue-600 bg-clip-text text-transparent">{formatPrice(finalPrice)}</span>
        {product.compare_at_price && <span className="text-lg text-gray-400 line-through">{formatPrice(product.compare_at_price)}</span>}
        {discount > 0 && <span className="bg-gradient-to-r from-ep-red to-red-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">-{discount}% · Ahorrás {formatPrice(savings)}</span>}
      </div>

      {product.variants && product.variants.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2">Variante:</p>
          <div className="flex gap-2 flex-wrap">
            {product.variants.map(v => (
              <button key={v.id} onClick={() => setSelectedVariant(v.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all duration-200 ${selectedVariant === v.id ? 'border-ep-navy bg-blue-50 text-ep-navy scale-105 shadow-md' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {v.value}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 items-center">
        <div className="flex items-center border-2 rounded-xl overflow-hidden">
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 text-lg hover:bg-gray-50 transition-colors">−</button>
          <span className="px-4 font-bold border-x">{qty}</span>
          <button onClick={() => setQty(qty + 1)} className="px-3 py-2 text-lg hover:bg-gray-50 transition-colors">+</button>
        </div>
      </div>

      <button onClick={handleBuyNow}
        className="w-full bg-gradient-to-r from-ep-red to-red-600 hover:from-red-600 hover:to-ep-red text-white font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-lg shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 hover:scale-[1.02] active:scale-[0.98]">
        <Zap className="w-5 h-5" /> COMPRAR AHORA
      </button>

      <button onClick={() => { for (let i = 0; i < qty; i++) addItem(product, variant); }}
        className="w-full bg-gradient-to-r from-ep-navy to-blue-700 hover:from-blue-700 hover:to-ep-navy text-white font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg">
        <ShoppingCart className="w-5 h-5" /> Agregar al carrito
      </button>

      <a href="https://wa.me/541138848412" target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full border-2 border-green-500 text-green-600 font-semibold py-3 rounded-xl hover:bg-green-50 transition-all hover:shadow-md">
        <MessageCircle className="w-5 h-5" /> Consultar por WhatsApp
      </a>

      <div className="grid grid-cols-3 gap-2">
        {[['🚚','Envío GRATIS'],['🛡️','Garantía 30 días'],['💬','Soporte WhatsApp']].map(([icon,text])=>(
          <div key={text} className="text-center p-3 bg-gradient-to-br from-gray-50 to-white rounded-xl border text-xs hover:shadow-md transition-shadow">
            <span className="text-xl block mb-1">{icon}</span><span className="font-medium text-gray-700">{text}</span>
          </div>
        ))}
      </div>

      {product.specs && Object.keys(product.specs).length > 0 && (
        <div className="border rounded-xl overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-ep-navy to-blue-700 text-white px-4 py-2 font-bold text-sm">Especificaciones</div>
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(product.specs).map(([k, v], i) => (
                <tr key={k} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                  <td className="px-4 py-2.5 text-gray-500 font-medium">{k}</td>
                  <td className="px-4 py-2.5 text-gray-900">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
