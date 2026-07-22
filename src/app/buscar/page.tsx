export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/store/ProductCard';
import type { Product } from '@/types';

interface Props { searchParams: Promise<{ q?: string }> }

export default async function BuscarPage({ searchParams }: Props) {
  const { q } = await searchParams;
  let products: Product[] = [];
  if (q?.trim()) {
    const supabase = await createClient();
    const { data } = await supabase.from('products').select('*, category:categories(id,name,slug), images:product_images(*)').eq('is_active', true).or(`name.ilike.%${q}%,short_description.ilike.%${q}%`);
    products = (data || []) as unknown as Product[];
  }
  return (<div className="max-w-7xl mx-auto px-4 py-10">
    <form action="/buscar" className="flex gap-2 max-w-lg mb-8">
      <input name="q" type="search" defaultValue={q} placeholder="Buscar productos..." className="flex-1 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ep-navy" autoFocus/>
      <button type="submit" className="bg-ep-navy text-white font-bold px-5 py-3 rounded-xl text-sm">Buscar</button>
    </form>
    {q ? (products.length > 0 ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div>
    ) : <p className="text-center text-gray-400 py-20">Sin resultados para &quot;{q}&quot;</p>
    ) : <p className="text-center text-gray-400 py-20">Escribí lo que buscás</p>}
  </div>);
}
