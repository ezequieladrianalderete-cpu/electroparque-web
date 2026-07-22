export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/store/ProductCard';
import type { Product } from '@/types';

interface Props { searchParams: Promise<{ categoria?: string; orden?: string; q?: string }> }

export default async function ProductosPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  let query = supabase.from('products').select('*, category:categories(id,name,slug), images:product_images(*)').eq('is_active', true);
  if (params.categoria) {
    const { data: cat } = await supabase.from('categories').select('id').eq('slug', params.categoria).single();
    if (cat) query = query.eq('category_id', cat.id);
  }
  if (params.q) query = query.or(`name.ilike.%${params.q}%,short_description.ilike.%${params.q}%`);
  query = query.order('is_featured', { ascending: false }).order('sort_order');
  const { data: products } = await query;
  const { data: categories } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order');

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-52 flex-shrink-0">
          <h2 className="text-lg font-bold mb-4">Categorías</h2>
          <ul className="space-y-1">
            <li><a href="/productos" className={`block px-3 py-2 rounded-lg text-sm font-medium ${!params.categoria ? 'bg-ep-navy text-white' : 'text-gray-600 hover:bg-gray-100'}`}>Todos</a></li>
            {(categories||[]).map((c: any) => (
              <li key={c.id}><a href={`/productos?categoria=${c.slug}`} className={`block px-3 py-2 rounded-lg text-sm font-medium ${params.categoria===c.slug ? 'bg-ep-navy text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{c.name}</a></li>
            ))}
          </ul>
        </aside>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{params.categoria ? (categories||[]).find((c:any)=>c.slug===params.categoria)?.name || 'Productos' : 'Todos los productos'}</h1>
            <span className="text-sm text-gray-500">{(products||[]).length} productos</span>
          </div>
          {(products||[]).length === 0 ? (
            <div className="text-center py-20 text-gray-400"><p className="text-lg font-medium">No hay productos disponibles</p></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{(products as unknown as Product[]).map(p=><ProductCard key={p.id} product={p}/>)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
