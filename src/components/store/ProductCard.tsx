'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Zap, Play, X } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/store/cart';
import { useRouter } from 'next/navigation';
import { findActiveOffer, applyOffer, type OfferLike } from '@/lib/offers';
import { OfferCountdown } from './OfferCountdown';
import type { Product } from '@/types';

export function ProductCard({ product, offers = [] }: { product: Product; offers?: OfferLike[] }) {
  const { addItem, buyNow } = useCart();
  const router = useRouter();
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const primaryImage = product.images?.find(i => i.is_primary) || product.images?.[0];
  // El preview solo funciona con un video subido directo (no un link de YouTube, que no se puede
  // reproducir así de simple encima de la miniatura).
  const previewVideoUrl = product.video_url && !/youtu\.?be/.test(product.video_url) ? product.video_url : null;

  const activeOffer = findActiveOffer(offers, { id: product.id, category_id: product.category_id });
  const effectivePrice = activeOffer ? applyOffer(product.price, activeOffer) : product.price;
  const referencePrice = activeOffer ? product.price : product.compare_at_price;
  const discount = referencePrice ? Math.round((1 - effectivePrice / referencePrice) * 100) : 0;
  // Si hay oferta activa, el carrito debe usar el precio ya descontado (no el de lista).
  const cartProduct = activeOffer ? { ...product, price: effectivePrice, compare_at_price: product.price } : product;

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    buyNow(cartProduct);
    router.push('/checkout');
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-ep-navy/20 transition-all duration-300 group hover:-translate-y-1">
      <Link href={`/productos/${product.slug}`}
        className="block"
        onMouseEnter={() => previewVideoUrl && setPreviewPlaying(true)}
        onMouseLeave={() => setPreviewPlaying(false)}>
        <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
          {previewVideoUrl && previewPlaying ? (
            <video src={previewVideoUrl} className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline />
          ) : primaryImage ? (
            <Image src={primaryImage.url} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <span className="text-5xl group-hover:scale-110 transition-transform">📦</span>
          )}
          {discount > 0 && <span className="absolute top-2 left-2 bg-ep-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-{discount}%</span>}
          {product.is_featured && <span className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">⭐ TOP</span>}
          {previewVideoUrl && (
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); setPreviewPlaying(p => !p); }}
              className="absolute bottom-2 right-2 bg-black/60 text-white w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/75 transition-colors"
              title={previewPlaying ? 'Ver foto' : 'Ver video'}>
              {previewPlaying ? <X className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
            </button>
          )}
        </div>
      </Link>
      <div className="p-3">
        {product.category && <p className="text-[10px] text-ep-red font-bold uppercase tracking-wider mb-1">{product.category.name}</p>}
        <Link href={`/productos/${product.slug}`}>
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem] hover:text-ep-navy transition-colors">{product.name}</h3>
        </Link>
        {activeOffer && (
          <div className="mt-1 space-y-0.5">
            <p className="text-[10px] text-ep-red font-bold uppercase tracking-wide truncate">🏷️ {activeOffer.name}</p>
            {activeOffer.ends_at && <OfferCountdown endsAt={activeOffer.ends_at} compact />}
          </div>
        )}
        <div className="flex items-center gap-2 mt-2 mb-3">
          <span className="text-lg font-extrabold bg-gradient-to-r from-ep-navy to-blue-600 bg-clip-text text-transparent">{formatPrice(effectivePrice)}</span>
          {referencePrice && <span className="text-xs text-gray-400 line-through">{formatPrice(referencePrice)}</span>}
        </div>
        <div className="flex gap-1.5">
          <button onClick={handleBuyNow} className="flex-1 bg-gradient-to-r from-ep-red to-red-600 hover:from-red-600 hover:to-ep-red text-white text-xs font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm hover:shadow-md">
            <Zap className="w-3 h-3" /> COMPRAR
          </button>
          <button onClick={(e) => { e.preventDefault(); addItem(cartProduct); }} className="bg-ep-navy hover:bg-ep-navy-light text-white p-2.5 rounded-lg transition-colors" title="Agregar al carrito">
            <ShoppingCart className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
