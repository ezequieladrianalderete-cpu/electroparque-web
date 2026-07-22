export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();
  const [{ count: prodCount },{ count: orderCount },{ count: reviewCount },{ count: bannerCount }] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('is_approved', false),
    supabase.from('banners').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-ep-navy rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">EP</span></div>
          <div><h1 className="font-bold text-lg">Panel Admin</h1><p className="text-xs text-gray-500">Electro Parque</p></div>
        </div>
        <Link href="/" className="text-sm text-gray-500 hover:text-ep-navy px-3 py-1.5 border rounded-lg">🌐 Ver tienda</Link>
      </div>
      <div className="max-w-5xl mx-auto p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/admin/productos" className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
            <span className="text-2xl">📦</span><p className="text-2xl font-extrabold mt-2">{prodCount||0}</p><p className="text-sm text-gray-500">Productos</p>
          </Link>
          <Link href="/admin/pedidos" className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
            <span className="text-2xl">🛒</span><p className="text-2xl font-extrabold mt-2">{orderCount||0}</p><p className="text-sm text-gray-500">Pedidos</p>
          </Link>
          <Link href="/admin/resenas" className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
            <span className="text-2xl">⭐</span><p className="text-2xl font-extrabold mt-2">{reviewCount||0}</p><p className="text-sm text-gray-500">Reseñas pendientes</p>
          </Link>
          <Link href="/admin/banners" className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow">
            <span className="text-2xl">🖼️</span><p className="text-2xl font-extrabold mt-2">{bannerCount||0}</p><p className="text-sm text-gray-500">Banners</p>
          </Link>
        </div>

        <h2 className="font-bold text-gray-700 mb-3">Gestionar contenido</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ['📦','Productos','/admin/productos','Ver, crear y editar productos'],
            ['📁','Categorías','/admin/categorias','Organizar productos'],
            ['🖼️','Banners','/admin/banners','Imágenes de portada'],
            ['🏷️','Ofertas','/admin/ofertas','Descuentos y promos'],
            ['🛒','Pedidos','/admin/pedidos','Ventas recibidas'],
            ['⭐','Reseñas','/admin/resenas','Aprobar opiniones'],
            ['📝','Blog','/admin/publicaciones','Artículos y noticias'],
            ['⚙️','Configuración','/admin/configuracion','Logo, WhatsApp, datos'],
          ].map(([icon,label,href,desc])=>(
            <Link key={label} href={href} className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow">
              <span className="text-2xl">{icon}</span>
              <p className="font-bold text-sm mt-2">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
