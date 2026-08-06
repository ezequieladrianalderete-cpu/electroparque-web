'use client';
import Link from 'next/link';
import type { Banner } from '@/types';

// Fuerza el mute por código (no solo por el atributo HTML) y arranca la reproducción a mano.
// En el celular, si el navegador no llega a "ver" el video como silenciado a tiempo,
// bloquea el autoplay y el video queda esperando a que alguien lo toque.
function setAutoplayVideoRef(el: HTMLVideoElement | null) {
  if (!el) return;
  el.muted = true;
  el.play().catch(() => {});
}

export function VideoBanner({ banner }: { banner: Banner }) {
  return (
    <section className="relative overflow-hidden text-white px-4 py-14 sm:py-16 min-h-[420px] sm:min-h-[500px] md:min-h-[600px] flex items-center">
      {banner.video_url ? (
        <video
          ref={setAutoplayVideoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={banner.video_url}
          poster={banner.image_mobile_url || banner.image_url || undefined}
          autoPlay muted loop playsInline
        />
      ) : banner.image_url ? (
        <>
          <div className="absolute inset-0 bg-cover bg-center block sm:hidden" style={{ backgroundImage: `url(${banner.image_mobile_url || banner.image_url})` }} />
          <div className="absolute inset-0 bg-cover bg-center hidden sm:block" style={{ backgroundImage: `url(${banner.image_url})` }} />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-ep-navy to-blue-800" />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-ep-navy/60 via-ep-navy/40 to-black/45" />
      <div className="max-w-3xl mx-auto text-center relative z-10 w-full">
        {banner.title && <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">{banner.title}</h2>}
        {banner.subtitle && <p className="text-white/85 text-lg mb-8 leading-relaxed">{banner.subtitle}</p>}
        {banner.link_url && (
          <Link href={banner.link_url} className="inline-block bg-gradient-to-r from-ep-red to-red-500 hover:from-red-500 hover:to-ep-red text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-red-500/30 hover:shadow-xl hover:scale-105 text-lg">
            {banner.link_text || 'Ver más'} →
          </Link>
        )}
      </div>
    </section>
  );
}
