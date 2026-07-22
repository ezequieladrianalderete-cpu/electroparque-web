export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/store/ProductCard';
import type { Product } from '@/types';

export default async function OfertasPage() {
  const supabase = await createClient();
  const { data: products } = await supabase.from('products').select('*, category:categories(id,name,slug), images:product_images(*)').eq('is_active', true).not('compare_at_price', 'is', null).order('sort_order');
  return (<div className="max-w-7xl mx-auto px-4 py-10">
    <div className="text-center mb-8">
      <h1 className="text-3xl font-extrabold text-ep-navy">⚡ Ofertas especiales</h1>
      <p className="text-gray-500 mt-1">Productos con descuento por tiempo limitado</p>
    </div>
    {(products||[]).length > 0 ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{(products as unknown as Product[]).map(p=><ProductCard key={p.id} product={p}/>)}</div>
    ) : (
      <p className="text-center text-gray-400 py-20">No hay ofertas activas en este momento.</p>
    )}
  </div>);
}
