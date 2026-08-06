'use client';
import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { VideoTestimonial } from '@/types';

export function VideoTestimonialCarousel({ videos }: { videos: VideoTestimonial[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  // Solo reproducimos los videos que están realmente a la vista (mejor para el rendimiento
  // que hacer arrancar los 6+ videos apenas carga la página).
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      });
    }, { root, threshold: 0.6 });

    Object.values(videoRefs.current).forEach(v => { if (v) observer.observe(v); });
    return () => observer.disconnect();
  }, [videos]);

  const scroll = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {videos.map(v => (
          <div key={v.id} className="flex-shrink-0 w-52 snap-start">
            <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-gray-900 shadow-sm">
              <video
                ref={el => { videoRefs.current[v.id] = el; if (el) el.muted = true; }}
                src={v.video_url}
                poster={v.thumbnail_url || undefined}
                className="w-full h-full object-cover"
                muted loop playsInline preload="metadata"
                onClick={e => { const el = e.currentTarget; el.muted ? (el.muted = false, el.setAttribute('controls', '')) : (el.muted = true, el.removeAttribute('controls')); }}
              />
            </div>
            {v.caption && <p className="text-sm text-gray-600 mt-2 text-center truncate">{v.caption}</p>}
          </div>
        ))}
      </div>

      {videos.length > 3 && (
        <>
          <button onClick={() => scroll(-1)} aria-label="Anterior"
            className="hidden sm:flex absolute -left-4 top-1/3 -translate-y-1/2 items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border hover:bg-gray-50">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => scroll(1)} aria-label="Siguiente"
            className="hidden sm:flex absolute -right-4 top-1/3 -translate-y-1/2 items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border hover:bg-gray-50">
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
}
