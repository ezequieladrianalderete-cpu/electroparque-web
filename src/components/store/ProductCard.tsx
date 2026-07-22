'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/store/cart';
import type { Product } from '@/types';

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const primaryImage = product.images?.find(i => i.is_primary) || product.images?.[0];
  const discount = product.compare_at_price ? Math.round((1 - product.price / product.compare_at_price) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-ep-navy/20 transition-all group">
      <Link href={`/productos/${product.slug}`}>
        <div className="aspect-square bg-gray-50 flex items-center justify-center relative overflow-hidden">
          {primaryImage ? (
            <Image src={primaryImage.url} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <span className="text-5xl">📦</span>
          )}
          {discount > 0 && <span className="absolute top-2 left-2 bg-ep-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-{discount}%</span>}
          {product.is_featured && <span className="absolute top-2 right-2 bg-ep-navy text-white text-[10px] font-bold px-2 py-0.5 rounded-full">⭐</span>}
        </div>
      </Link>
      <div className="p-3">
        {product.category && <p className="text-[10px] text-ep-red font-bold uppercase tracking-wide mb-1">{product.category.name}</p>}
        <Link href={`/productos/${product.slug}`}>
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem] hover:text-ep-navy">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-2 mt-2 mb-3">
          <span className="text-lg font-extrabold text-ep-navy">{formatPrice(product.price)}</span>
          {product.compare_at_price && <span className="text-xs text-gray-400 line-through">{formatPrice(product.compare_at_price)}</span>}
        </div>
        <button onClick={() => addItem(product)} className="w-full bg-ep-navy hover:bg-ep-red text-white text-xs font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5">
          <ShoppingCart className="w-3.5 h-3.5" /> Agregar
        </button>
      </div>
    </div>
  );
}
