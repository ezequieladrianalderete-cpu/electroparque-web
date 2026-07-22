'use client';
import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { Plus, Trash2, ArrowLeft, Eye, EyeOff, Pencil } from 'lucide-react';
import Link from 'next/link';

export default function ProductosListPage() {
  const { supabase, loading: authLoading } = useAdmin();
  const [products, setProducts] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { if (!authLoading) load(); }, [authLoading]);
  const load = async () => {
    const { data } = await supabase.from('products').select('*, category:categories(name), images:product_images(url,is_primary)').order('created_at', { ascending: false });
    setProducts(data || []);
    setLoaded(true);
  };
  const toggle = async (id: string, active: boolean) => { await supabase.from('products').update({ is_active: !active }).eq('id', id); await load(); };
  const toggleFeatured = async (id: string, featured: boolean) => { await supabase.from('products').update({ is_featured: !featured }).eq('id', id); await load(); };
  const remove = async (id: string) => { if (confirm('¿Eliminar producto definitivamente?')) { await supabase.from('product_images').delete().eq('product_id', id); await supabase.from('product_variants').delete().eq('product_id', id); await supabase.from('products').delete().eq('id', id); await load(); } };

  if (authLoading || !loaded) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/admin/dashboard" className="p-2 border rounded-lg"><ArrowLeft className="w-4 h-4"/></Link>
        <h1 className="font-bold text-lg flex-1">Mis Productos ({products.length})</h1>
        <Link href="/admin/productos/nuevo" className="bg-ep-navy text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus className="w-4 h-4"/>Nuevo producto</Link>
      </div>
      <div className="max-w-5xl mx-auto p-6">
        {products.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-4">📦</p>
            <p className="text-lg font-medium mb-2">No tenés productos todavía</p>
            <Link href="/admin/productos/nuevo" className="text-ep-navy font-bold">+ Crear el primero</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map(p => {
              const img = p.images?.find((i:any) => i.is_primary)?.url || p.images?.[0]?.url;
              return (
                <div key={p.id} className="bg-white rounded-xl border p-4 flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {img ? <img src={img} alt="" className="w-full h-full object-cover"/> : <span className="text-2xl">📦</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.category?.name || 'Sin categoría'} · SKU: {p.sku || '—'}</p>
                    <p className="text-sm font-bold text-ep-navy mt-1">${Number(p.price).toLocaleString('es-AR')}{p.compare_at_price ? <span className="text-xs text-gray-400 line-through ml-2">${Number(p.compare_at_price).toLocaleString('es-AR')}</span> : ''}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleFeatured(p.id, p.is_featured)} className={`px-2 py-1 rounded text-xs font-bold ${p.is_featured ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-400'}`} title="Destacado">{p.is_featured ? '⭐' : '☆'}</button>
                    <button onClick={() => toggle(p.id, p.is_active)} className={`p-2 rounded-lg ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`} title={p.is_active ? 'Visible' : 'Oculto'}>
                      {p.is_active ? <Eye className="w-4 h-4"/> : <EyeOff className="w-4 h-4"/>}
                    </button>
                    <Link href={`/admin/productos/${p.id}`} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Pencil className="w-4 h-4"/></Link>
                    <button onClick={() => remove(p.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
