'use client';
import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import type { VideoTestimonial } from '@/types';

export function VideoTestimonialCarousel({ videos }: { videos: VideoTestimonial[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const scroll = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {videos.map(v => (
          <div key={v.id} className="flex-shrink-0 w-52 snap-start">
            <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-gray-900 shadow-sm">
              {playingId === v.id ? (
                <video src={v.video_url} className="w-full h-full object-cover" controls autoPlay playsInline />
              ) : (
                <button onClick={() => setPlayingId(v.id)} className="group absolute inset-0 w-full h-full">
                  {v.thumbnail_url ? (
                    <img src={v.thumbnail_url} alt={v.caption || ''} className="w-full h-full object-cover" />
                  ) : (
                    <video src={v.video_url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors flex items-center justify-center">
                    <span className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 text-ep-navy fill-ep-navy ml-0.5" />
                    </span>
                  </div>
                </button>
              )}
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
