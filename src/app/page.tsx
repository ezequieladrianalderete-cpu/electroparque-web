export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/store/ProductCard';
import { HeroCarousel } from '@/components/store/HeroCarousel';
import { VideoBanner } from '@/components/store/VideoBanner';
import Link from 'next/link';
import type { Product, Banner } from '@/types';
import { OfferCountdown } from '@/components/store/OfferCountdown';

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: products }, { data: heroBanners }, { data: promoBanners }, { data: reviews }, { data: allRatings }, { data: offers }, { data: categories }] = await Promise.all([
    supabase.from('products').select('*, category:categories(id,name,slug), images:product_images(*)').eq('is_active', true).eq('is_featured', true).order('sort_order').limit(8),
    supabase.from('banners').select('*').eq('is_active', true).eq('placement', 'hero').order('sort_order'),
    supabase.from('banners').select('*').eq('is_active', true).eq('placement', 'promo').order('sort_order'),
    supabase.from('reviews').select('*').eq('is_approved', true).eq('is_featured', true).limit(6),
    supabase.from('reviews').select('rating').eq('is_approved', true),
    supabase.from('offers').select('*').eq('is_active', true).gt('ends_at', new Date().toISOString()).order('created_at', { ascending: false }),
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
  ]);
  const reviewCount = allRatings?.length || 0;
  const avgRating = reviewCount > 0 ? (allRatings!.reduce((sum, r: any) => sum + r.rating, 0) / reviewCount).toFixed(1) : null;

  return (
    <div>
      <HeroCarousel banners={(heroBanners as unknown as Banner[]) || []} />

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
          <h2 className="text-2xl font-extrabold text-center mb-2 text-ep-navy">Explorá por categoría</h2>
          <p className="text-gray-400 text-center text-sm mb-8">Encontrá lo que buscás rápido</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((c: any, i: number) => (
              <Link key={c.id} href={`/productos?categoria=${c.slug}`}
                className="group relative bg-gradient-to-br from-ep-navy to-blue-700 rounded-2xl p-6 text-center text-white overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105">
                {c.image_url && (
                  <div className="absolute inset-0 bg-cover bg-center opacity-50 group-hover:opacity-60 transition-opacity duration-300" style={{ backgroundImage: `url(${c.image_url})` }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"/>
                <div className="relative z-10">
                  {!c.image_url && (
                    <span className="text-3xl block mb-2 group-hover:scale-125 transition-transform duration-300">{['🎵','🏍️','📡','⚡'][i % 4]}</span>
                  )}
                  <p className="font-bold text-sm mt-2">{c.name}</p>
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
            <h2 className="text-3xl font-extrabold text-ep-navy">Productos destacados</h2>
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
            <h2 className="text-3xl font-extrabold text-center mb-2 text-ep-navy">Lo que dicen nuestros clientes</h2>
            {avgRating && (
              <div className="flex justify-center items-center gap-2 mb-10">
                <span className="text-yellow-400 text-lg">{'★'.repeat(Math.round(parseFloat(avgRating)))}</span>
                <span className="font-bold">{avgRating}</span>
                <span className="text-gray-500 text-sm">· {reviewCount} {reviewCount === 1 ? 'opinión' : 'opiniones'}</span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {reviews.map((r: any, i: number) => (
                <div key={r.id} className="bg-white rounded-2xl p-6 border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1" style={{animationDelay: `${i * 0.1}s`}}>
                  <div className="text-yellow-400 text-sm mb-3">{'★'.repeat(r.rating)}</div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4 italic">&ldquo;{r.comment}&rdquo;</p>
                  <div className="flex items-center gap-2">
                    {r.customer_photo_url ? (
                      <img src={r.customer_photo_url} alt={r.customer_name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-ep-navy to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">{r.customer_name?.[0]}</div>
                    )}
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
          <a href="https://wa.me/541144128645" className="inline-block bg-white text-ep-navy font-bold px-10 py-4 rounded-2xl hover:scale-110 transition-all duration-300 shadow-xl text-lg">💬 Contactar por WhatsApp</a>
        </div>
      </section>

      {((promoBanners as unknown as Banner[]) || []).map(b => <VideoBanner key={b.id} banner={b} />)}
    </div>
  );
}
