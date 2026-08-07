'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { EmojiSafeText } from './EmojiSafeText';
import type { Banner } from '@/types';

const AUTO_ADVANCE_MS = 7500;

export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const slides: (Banner | null)[] = banners.length > 0 ? banners : [null];
  const [index, setIndex] = useState(0);
  const settings = useStoreSettings();

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setIndex(i => (i + 1) % slides.length), AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Deslizar con el dedo para cambiar de banner en pantallas táctiles — antes solo se
  // podía esperar el avance automático o tocar los puntitos.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const SWIPE_THRESHOLD = 40;
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || slides.length <= 1) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    setIndex(i => dx < 0 ? (i + 1) % slides.length : (i - 1 + slides.length) % slides.length);
  };

  const banner = slides[index];
  // El texto de relleno solo es para cuando no hay ningún banner cargado todavía —
  // un banner real con título/subtítulo vacío (foto sola) no debe rellenarse con esto.
  const heroTitle = banner ? banner.title : 'CONECTIVIDAD INTELIGENTE';
  const heroSubtitle = banner ? banner.subtitle : 'Importación directa de tecnología. Envío GRATIS a todo el país.';
  const heroWords = (heroTitle || '').toUpperCase().split(' ').filter(Boolean);
  const heroMid = Math.ceil(heroWords.length / 2);
  const heroLine1 = heroWords.slice(0, heroMid).join(' ');
  const heroLine2 = heroWords.slice(heroMid).join(' ');

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#070e27] via-ep-navy to-[#1a3a8f] text-white py-14 sm:py-20 md:py-24 px-4 min-h-[420px] sm:min-h-[500px] md:min-h-[580px] lg:min-h-[640px] flex items-center"
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="flex h-full sm:hidden transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map((s, i) => (
            <div key={i} className="w-full h-full flex-shrink-0 bg-cover bg-center" style={s?.image_url ? { backgroundImage: `url(${s.image_mobile_url || s.image_url})` } : undefined} />
          ))}
        </div>
        <div className="hidden sm:flex h-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ transform: `translateX(-${index * 100}%)` }}>
          {slides.map((s, i) => (
            <div key={i} className="w-full h-full flex-shrink-0 bg-cover bg-center" style={s?.image_url ? { backgroundImage: `url(${s.image_url})` } : undefined} />
          ))}
        </div>
      </div>
      {banner?.image_url && <div className="absolute inset-0 bg-gradient-to-br from-[#070e27]/65 via-ep-navy/55 to-[#1a3a8f]/60" />}
      <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 20%, #e10600 0%, transparent 40%), radial-gradient(circle at 60% 80%, #1e40af 0%, transparent 50%)'}}/>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-ep-red/10 rounded-full blur-3xl animate-float"/>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{animationDelay:'1.5s'}}/>
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10 w-full">
        <span className="inline-block bg-gradient-to-r from-ep-red to-red-500 text-white text-xs font-bold px-5 py-2 rounded-full mb-6 uppercase tracking-widest shadow-lg shadow-red-500/30">🆕 Nuevo</span>
        {heroTitle && (
          <h1 key={`title-${index}`} className="text-5xl sm:text-7xl font-extrabold leading-[0.9] mb-6 animate-fadeInUp">
            <span className="block"><EmojiSafeText text={heroLine1} className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent" /></span>
            {heroLine2 && <span className="block mt-2"><EmojiSafeText text={heroLine2} className="bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent" /></span>}
          </h1>
        )}
        {heroSubtitle && <p className="text-blue-200/80 text-lg max-w-xl mx-auto mb-10 leading-relaxed">{heroSubtitle}</p>}
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href={banner?.link_url || '/productos'} className="bg-gradient-to-r from-ep-red to-red-500 hover:from-red-500 hover:to-ep-red text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-red-500/30 hover:shadow-xl hover:scale-105 text-lg">{banner?.link_text || 'Ver productos'} →</Link>
          <a href={`https://wa.me/${settings.whatsapp_number}`} className="bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold px-7 py-4 rounded-2xl hover:bg-white/20 transition-all duration-300 hover:scale-105">💬 Consultar</a>
        </div>

        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setIndex(i)} aria-label={`Ir al banner ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${i === index ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`} />
            ))}
          </div>
        )}
      </div>

      {slides.length > 1 && (
        <>
          <button onClick={() => setIndex(i => (i - 1 + slides.length) % slides.length)} aria-label="Banner anterior"
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full p-2 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setIndex(i => (i + 1) % slides.length)} aria-label="Banner siguiente"
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 items-center justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full p-2 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </section>
  );
}
