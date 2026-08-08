'use client';
import { useState, useEffect } from 'react';
import { ShoppingCart, Zap, MessageCircle, Heart } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/store/cart';
import { useWishlist } from '@/store/wishlist';
import { useRouter } from 'next/navigation';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { findActiveOffer, applyOffer, type OfferLike } from '@/lib/offers';
import { OfferCountdown } from './OfferCountdown';
import { trackViewItem } from '@/lib/analytics';
import { logEvent } from '@/lib/track';
import type { Product, Review } from '@/types';

export function ProductInfo({ product, reviews, avgRating, offers = [] }: { product: Product; reviews: Review[]; avgRating: string | null; offers?: OfferLike[] }) {
  const { addItem, buyNow } = useCart();
  const { has, toggle } = useWishlist();
  const settings = useStoreSettings();
  const router = useRouter();
  const isFavorite = has(product.id);

  useEffect(() => {
    trackViewItem(product);
    logEvent('view_product', { product_id: product.id, category_id: product.category_id || undefined });
  }, [product.id]);
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]?.id || '');
  const [qty, setQty] = useState(1);
  const variant = product.variants?.find(v => v.id === selectedVariant);

  const activeOffer = findActiveOffer(offers, { id: product.id, category_id: product.category_id });
  const basePrice = activeOffer ? applyOffer(product.price, activeOffer) : product.price;
  const referencePrice = activeOffer ? product.price : product.compare_at_price;
  const finalPrice = basePrice + (variant?.price_modifier || 0);
  const discount = referencePrice ? Math.round((1 - basePrice / referencePrice) * 100) : 0;
  const savings = referencePrice ? referencePrice - basePrice : 0;
  // Si hay oferta activa, el carrito debe usar el precio ya descontado (no el de lista).
  const cartProduct = activeOffer ? { ...product, price: basePrice, compare_at_price: product.price } : product;

  const handleBuyNow = () => { buyNow(cartProduct, variant, qty); router.push('/checkout'); };

  const waMsg = `Hola! Estoy interesado en:\n\n📦 *${product.name}*${variant ? `\n🎨 ${variant.name}: ${variant.value}` : ''}\n💰 Precio: ${formatPrice(finalPrice)}\n🔢 Cantidad: ${qty}\n\n¿Está disponible? Quiero más info.`;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          {product.category && <span className="text-ep-red text-xs font-bold uppercase tracking-wider">{product.category.name}</span>}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">{product.name}</h1>
        </div>
        <button onClick={() => toggle(product.id)}
          className="flex-shrink-0 border-2 rounded-xl p-3 hover:bg-gray-50 transition-colors"
          title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}>
          <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-ep-red text-ep-red' : 'text-gray-400'}`} />
        </button>
      </div>

      {avgRating && (
        <div className="flex items-center gap-2">
          <span className="text-yellow-400">{'★'.repeat(Math.round(parseFloat(avgRating)))}</span>
          <span className="font-bold text-sm">{avgRating}</span>
          <span className="text-gray-400 text-sm">({reviews.length} opiniones)</span>
        </div>
      )}

      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-5 border">
        {activeOffer && (
          <p className="text-ep-red text-xs font-bold uppercase tracking-wide mb-2">🏷️ {activeOffer.name}</p>
        )}
        <div className="flex flex-wrap items-end gap-3">
          <span className="text-3xl font-extrabold bg-gradient-to-r from-ep-navy to-blue-600 bg-clip-text text-transparent">{formatPrice(finalPrice)}</span>
          {referencePrice && <span className="text-lg text-gray-400 line-through">{formatPrice(referencePrice)}</span>}
          {discount > 0 && <span className="bg-gradient-to-r from-ep-red to-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">-{discount}% · Ahorrás {formatPrice(savings)}</span>}
        </div>
        {activeOffer?.ends_at && <div className="mt-3"><OfferCountdown endsAt={activeOffer.ends_at} compact /></div>}
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
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 text-lg hover:bg-gray-50">−</button>
          <span className="px-4 font-bold border-x">{qty}</span>
          <button onClick={() => setQty(qty + 1)} className="px-3 py-2 text-lg hover:bg-gray-50">+</button>
        </div>
      </div>

      <button onClick={handleBuyNow}
        className="w-full bg-gradient-to-r from-ep-red to-red-600 hover:from-red-600 hover:to-ep-red text-white font-bold py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 text-lg shadow-lg shadow-red-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
        <Zap className="w-5 h-5" /> COMPRAR AHORA
      </button>

      <button onClick={() => { for (let i = 0; i < qty; i++) addItem(cartProduct, variant); }}
        className="w-full border-2 border-ep-navy text-ep-navy hover:bg-ep-navy hover:text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
        <ShoppingCart className="w-5 h-5" /> Agregar al carrito
      </button>

      <a href={`https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(waMsg)}`} target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full border-2 border-green-500 text-green-600 font-semibold py-3 rounded-xl hover:bg-green-50 transition-all hover:shadow-md">
        <MessageCircle className="w-5 h-5" /> Consultar por WhatsApp
      </a>

      <div className="grid grid-cols-3 gap-2">
        {[['🚚','Envío GRATIS a todo el país'],['🛡️','Garantía 30 días'],['💬','Soporte WhatsApp']].map(([icon,text])=>(
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
