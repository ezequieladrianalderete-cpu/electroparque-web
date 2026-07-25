export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/store/ProductCard';
import Link from 'next/link';
import type { Product } from '@/types';
import { OfferCountdown } from '@/components/store/OfferCountdown';

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: products }, { data: banners }, { data: reviews }, { data: offers }, { data: categories }] = await Promise.all([
    supabase.from('products').select('*, category:categories(id,name,slug), images:product_images(*)').eq('is_active', true).eq('is_featured', true).order('sort_order').limit(8),
    supabase.from('banners').select('*').eq('is_active', true).order('sort_order').limit(1),
    supabase.from('reviews').select('*').eq('is_approved', true).eq('is_featured', true).limit(6),
    supabase.from('offers').select('*').eq('is_active', true).gt('ends_at', new Date().toISOString()).order('created_at', { ascending: false }),
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
  ]);
  const banner = banners?.[0];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#070e27] via-ep-navy to-[#1a3a8f] text-white py-24 px-4">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #e10600 0%, transparent 40%), radial-gradient(circle at 60% 80%, #1e40af 0%, transparent 50%)'}}/>
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-ep-red/10 rounded-full blur-3xl animate-float"/>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{animationDelay:'1.5s'}}/>
        </div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <span className="inline-block bg-gradient-to-r from-ep-red to-red-500 text-white text-xs font-bold px-5 py-2 rounded-full mb-6 uppercase tracking-widest shadow-lg shadow-red-500/30 animate-pulse">🆕 {banner?.title || 'Tecnología de punta'}</span>
          <h1 className="text-5xl sm:text-7xl font-extrabold leading-[0.9] mb-6">
            <span className="block bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">CONECTIVIDAD</span>
            <span className="block bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent mt-2">INTELIGENTE</span>
          </h1>
          <p className="text-blue-200/80 text-lg max-w-xl mx-auto mb-10 leading-relaxed">{banner?.subtitle || 'Importación directa de tecnología. Envío GRATIS a todo el país.'}</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href={banner?.link_url || '/productos'} className="bg-gradient-to-r from-ep-red to-red-500 hover:from-red-500 hover:to-ep-red text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-red-500/30 hover:shadow-xl hover:scale-105 text-lg">{banner?.link_text || 'Ver productos'} →</Link>
            <a href="https://wa.me/541138848412" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold px-7 py-4 rounded-2xl hover:bg-white/20 transition-all duration-300 hover:scale-105">💬 Consultar</a>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <div className="bg-gradient-to-r from-white via-gray-50 to-white border-y py-6 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[['🚚','Envío GRATIS','En todas las compras'],['🛡️','Garantía','30 días'],['💳','MercadoPago','Pago seguro'],['💬','WhatsApp','Respuesta rápida'],['🔄','Devoluciones','Sin preguntas'],['✅','Originales','Importación directa']].map(([i,t,s])=>(
            <div key={t} className="text-center p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <span className="text-2xl block animate-float" style={{animationDelay: `${Math.random()*2}s`}}>{i}</span>
              <p className="text-[10px] font-bold text-gray-800 mt-1.5">{t}</p>
              <p className="text-[9px] text-gray-500">{s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-14">
          <h2 className="text-2xl font-extrabold text-center mb-2 bg-gradient-to-r from-ep-navy to-blue-600 bg-clip-text text-transparent">Explorá por categoría</h2>
          <p className="text-gray-400 text-center text-sm mb-8">Encontrá lo que buscás rápido</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((c: any, i: number) => (
              <Link key={c.id} href={`/productos?categoria=${c.slug}`}
                className="group relative bg-gradient-to-br from-ep-navy to-blue-700 rounded-2xl p-6 text-center text-white overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
                style={{animationDelay: `${i * 0.1}s`}}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"/>
                <div className="relative z-10">
                  <span className="text-3xl block mb-2 group-hover:scale-125 transition-transform duration-300">{['🎵','🏍️','📡','⚡'][i % 4]}</span>
                  <p className="font-bold text-sm">{c.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Offers with countdown */}
      {offers && offers.length > 0 && (
        <section className="relative bg-gradient-to-br from-[#0a0f2e] via-ep-navy to-[#1a3a8f] py-16 px-4 overflow-hidden">
          <div className="absolute inset-0 opacity-30" style={{backgroundImage:'radial-gradient(circle at 30% 70%, #e10600 0%, transparent 40%)'}}/>
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <span className="text-4xl animate-pulse">⚡</span>
              <div><h2 className="text-white text-3xl font-extrabold">Ofertas especiales</h2><p className="text-blue-300 text-sm">¡Aprovechá antes de que se terminen!</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {offers.map((o: any) => (
                <div key={o.id} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                  <span className="text-xs text-yellow-400 font-bold uppercase tracking-wider">🏷️ Oferta activa</span>
                  <p className="text-white font-bold text-lg mt-2 mb-3">{o.name}</p>
                  <span className="inline-block bg-gradient-to-r from-ep-red to-red-500 text-white text-sm font-bold px-4 py-1.5 rounded-full mb-4 shadow-lg shadow-red-500/30">
                    {o.discount_type === 'percentage' ? `${o.discount_value}% OFF` : `$${Number(o.discount_value).toLocaleString('es-AR')} OFF`}
                  </span>
                  {o.ends_at && <OfferCountdown endsAt={o.ends_at} />}
                  <Link href="/productos" className="block w-full bg-gradient-to-r from-ep-red to-red-500 hover:from-red-500 hover:to-ep-red text-white font-bold text-sm py-3 rounded-xl text-center mt-5 transition-all shadow-lg hover:shadow-xl">
                    Aprovechar oferta →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-ep-navy to-blue-600 bg-clip-text text-transparent">Productos destacados</h2>
            <p className="text-gray-400 text-sm mt-1">Lo que más eligen nuestros clientes</p>
          </div>
          <Link href="/productos" className="text-ep-navy font-semibold text-sm hover:text-ep-red transition-colors">Ver todos →</Link>
        </div>
        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {(products as unknown as Product[]).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-10">Pronto agregaremos productos destacados.</p>
        )}
      </section>

      {/* Reviews */}
      {reviews && reviews.length > 0 && (
        <section className="bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-extrabold text-center mb-2 bg-gradient-to-r from-ep-navy to-blue-600 bg-clip-text text-transparent">Lo que dicen nuestros clientes</h2>
            <div className="flex justify-center items-center gap-2 mb-10">
              <span className="text-yellow-400 text-lg">★★★★★</span><span className="font-bold">4.9</span><span className="text-gray-500 text-sm">· +500 clientes</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {reviews.map((r: any, i: number) => (
                <div key={r.id} className="bg-white rounded-2xl p-6 border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1" style={{animationDelay: `${i * 0.1}s`}}>
                  <div className="text-yellow-400 text-sm mb-3">{'★'.repeat(r.rating)}</div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4 italic">&ldquo;{r.comment}&rdquo;</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-ep-navy to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">{r.customer_name?.[0]}</div>
                    <p className="text-sm font-semibold">{r.customer_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="relative bg-gradient-to-r from-ep-red via-red-500 to-ep-red py-16 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(circle at 50% 50%, white 0%, transparent 60%)'}}/>
        <div className="relative z-10">
          <h2 className="text-white text-3xl font-extrabold mb-3">¿Necesitás ayuda para elegir?</h2>
          <p className="text-white/80 mb-8 text-lg">Nuestro equipo te asesora por WhatsApp en minutos</p>
          <a href="https://wa.me/541138848412" className="inline-block bg-white text-ep-navy font-bold px-10 py-4 rounded-2xl hover:scale-110 transition-all duration-300 shadow-xl text-lg">💬 Contactar por WhatsApp</a>
        </div>
      </section>
    </div>
  );
}
