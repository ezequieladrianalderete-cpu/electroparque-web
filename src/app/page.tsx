export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/store/ProductCard';
import Link from 'next/link';
import type { Product } from '@/types';
import { OfferCountdown } from '@/components/store/OfferCountdown';

export default async function HomePage() {
  const supabase = await createClient();
  const [{ data: products }, { data: banners }, { data: reviews }, { data: offers }] = await Promise.all([
    supabase.from('products').select('*, category:categories(id,name,slug), images:product_images(*)').eq('is_active', true).eq('is_featured', true).order('sort_order').limit(8),
    supabase.from('banners').select('*').eq('is_active', true).order('sort_order').limit(1),
    supabase.from('reviews').select('*').eq('is_approved', true).eq('is_featured', true).limit(6),
    supabase.from('offers').select('*').eq('is_active', true).order('created_at', { ascending: false }),
  ]);
  const banner = banners?.[0];

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0e1a3d] via-ep-navy to-ep-navy-light text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block bg-ep-red text-white text-xs font-bold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wide">🆕 {banner?.title || 'Tecnología de punta'}</span>
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight mb-4">CONECTIVIDAD<br/><span className="text-blue-300">INTELIGENTE</span></h1>
          <p className="text-blue-200 text-lg max-w-xl mx-auto mb-8">{banner?.subtitle || 'Importación directa de tecnología. Envío a todo el país.'}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href={banner?.link_url || '/productos'} className="bg-ep-red hover:bg-ep-red-dark text-white font-bold px-7 py-3.5 rounded-xl transition-colors">{banner?.link_text || 'Ver productos'} →</Link>
            <a href="https://wa.me/541138848412" className="bg-white/10 border border-white/25 text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-white/20 transition-colors">💬 Consultar</a>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <div className="bg-white border-y py-5 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[['🚚','Envío gratis','+$50K'],['🛡️','Garantía','12 meses'],['💳','MercadoPago','Pago seguro'],['💬','WhatsApp','Soporte 24/7'],['🔄','Devoluciones','30 días'],['✅','Originales','Importación directa']].map(([i,t,s])=>(
            <div key={t} className="text-center p-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xl block">{i}</span>
              <p className="text-[10px] font-bold text-gray-800 mt-1">{t}</p>
              <p className="text-[9px] text-gray-500">{s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Offers with countdown */}
      {offers && offers.length > 0 && (
        <section className="bg-gradient-to-br from-ep-navy to-ep-navy-light py-14 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-3xl">⚡</span>
              <div><h2 className="text-white text-2xl font-extrabold">Ofertas especiales</h2><p className="text-blue-200 text-sm">¡Por tiempo limitado!</p></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {offers.map((o: any) => (
                <div key={o.id} className="bg-white/10 border border-white/15 rounded-2xl p-5 backdrop-blur-sm">
                  <span className="text-xs text-yellow-400 font-bold uppercase">🏷️ Oferta</span>
                  <p className="text-white font-bold mt-2 mb-3">{o.name}</p>
                  <span className="inline-block bg-ep-red text-white text-sm font-bold px-3 py-1 rounded-full mb-4">
                    {o.discount_type === 'percentage' ? `${o.discount_value}% OFF` : `$${Number(o.discount_value).toLocaleString('es-AR')} OFF`}
                  </span>
                  {o.ends_at && <OfferCountdown endsAt={o.ends_at} />}
                  <Link href="/productos" className="block w-full bg-ep-red hover:bg-ep-red-dark text-white font-bold text-sm py-2.5 rounded-xl text-center mt-4 transition-colors">
                    Aprovechar →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured products */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="flex items-end justify-between mb-8">
          <div><h2 className="text-2xl font-extrabold text-ep-navy">Productos destacados</h2><p className="text-gray-500 text-sm mt-1">Lo más vendido</p></div>
          <Link href="/productos" className="text-ep-navy font-semibold text-sm hover:text-ep-red">Ver todos →</Link>
        </div>
        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {(products as unknown as Product[]).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-10">Pronto agregaremos productos destacados.</p>
        )}
      </section>

      {/* Reviews */}
      {reviews && reviews.length > 0 && (
        <section className="bg-gray-50 py-14 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-extrabold text-ep-navy text-center mb-8">Lo que dicen nuestros clientes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {reviews.map((r: any) => (
                <div key={r.id} className="bg-white rounded-xl p-5 border">
                  <div className="text-yellow-400 text-sm mb-2">{'★'.repeat(r.rating)}</div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">&ldquo;{r.comment}&rdquo;</p>
                  <p className="text-sm font-semibold">{r.customer_name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-ep-red py-14 px-4 text-center">
        <h2 className="text-white text-2xl font-extrabold mb-2">¿Necesitás ayuda para elegir?</h2>
        <p className="text-white/80 mb-6">Nuestro equipo te asesora por WhatsApp en minutos</p>
        <a href="https://wa.me/541138848412" className="inline-block bg-white text-ep-navy font-bold px-8 py-3.5 rounded-xl hover:scale-105 transition-transform">💬 Contactar por WhatsApp</a>
      </section>
    </div>
  );
}
