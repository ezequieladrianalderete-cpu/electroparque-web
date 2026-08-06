'use client';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/store/wishlist';
import { ProductCard } from '@/components/store/ProductCard';
import type { Product } from '@/types';
import type { OfferLike } from '@/lib/offers';

export default function FavoritosPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { ids } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<OfferLike[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (ids.length === 0) { setProducts([]); setLoaded(true); return; }
    setLoaded(false);
    Promise.all([
      supabase.from('products').select('*, category:categories(id,name,slug), images:product_images(*)').in('id', ids).eq('is_active', true),
      supabase.from('offers').select('*').eq('is_active', true),
    ]).then(([{ data }, { data: offersData }]) => {
      setProducts((data || []) as unknown as Product[]);
      setOffers((offersData || []) as unknown as OfferLike[]);
      setLoaded(true);
    });
  }, [ids.join(',')]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-8">
        <Heart className="w-6 h-6 text-ep-red fill-ep-red" />
        <h1 className="text-2xl font-extrabold text-gray-900">Mis favoritos</h1>
      </div>

      {!loaded ? (
        <p className="text-center text-gray-400 py-20">Cargando...</p>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => <ProductCard key={p.id} product={p} offers={offers} />)}
        </div>
      ) : (
        <div className="text-center py-20">
          <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium mb-4">Todavía no guardaste ningún producto</p>
          <Link href="/productos" className="inline-block bg-gradient-to-r from-ep-navy to-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform">Ver productos</Link>
        </div>
      )}
    </div>
  );
}
