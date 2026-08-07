'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import type { ProductImage } from '@/types';

export function ProductGallery({ images, productName, videoUrl }: { images: ProductImage[]; productName: string; videoUrl?: string }) {
  const sorted = [...images].sort((a, b) => (a.is_primary ? -1 : b.is_primary ? 1 : a.sort_order - b.sort_order));
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(false);

  const current = sorted[selected];
  const youtubeId = videoUrl?.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1];
  const isNativeVideo = videoUrl && !youtubeId;
  const hasVideo = !!videoUrl;

  // Deslizar con el dedo para cambiar de foto en pantallas táctiles, además de las
  // miniaturas y flechas que ya existían.
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const SWIPE_THRESHOLD = 40;
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current || sorted.length <= 1) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    setSelected(s => dx < 0 ? (s + 1) % sorted.length : (s - 1 + sorted.length) % sorted.length);
  };

  return (
    <div>
      {/* Main view */}
      <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center relative overflow-hidden border"
        onTouchStart={playingVideo ? undefined : onTouchStart} onTouchEnd={playingVideo ? undefined : onTouchEnd}>
        {playingVideo ? (
          // Video playing
          youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : (
            <video src={videoUrl} controls autoPlay className="w-full h-full object-contain" />
          )
        ) : current ? (
          // Image showing
          <div className="w-full h-full cursor-pointer" onClick={() => setLightbox(true)}>
            <Image src={current.url} alt={current.alt || productName} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-lg">🔍 Click para ampliar</div>
          </div>
        ) : hasVideo ? (
          // No images but has video — show play button
          <button onClick={() => setPlayingVideo(true)} className="flex flex-col items-center gap-3 text-gray-400 hover:text-ep-navy transition-colors">
            <div className="w-20 h-20 bg-ep-red rounded-full flex items-center justify-center shadow-lg"><Play className="w-10 h-10 text-white ml-1" /></div>
            <span className="text-sm font-medium">Reproducir video</span>
          </button>
        ) : (
          <span className="text-8xl">📦</span>
        )}
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
        {sorted.map((img, i) => (
          <button key={img.id} onClick={() => { setSelected(i); setPlayingVideo(false); }}
            className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${i === selected && !playingVideo ? 'border-ep-navy scale-105 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
            <Image src={img.url} alt={img.alt || ''} width={64} height={64} className="object-cover w-full h-full" />
          </button>
        ))}
        {hasVideo && (
          <button onClick={() => setPlayingVideo(true)}
            className={`w-16 h-16 rounded-lg border-2 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 transition-all hover:scale-105 ${playingVideo ? 'border-ep-red shadow-md' : 'border-gray-200'}`}>
            <Play className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && current && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center" onClick={() => setLightbox(false)}
          onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full z-10"><X className="w-7 h-7" /></button>
          {sorted.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setSelected(s => (s - 1 + sorted.length) % sorted.length); }} className="absolute left-4 text-white p-3 hover:bg-white/10 rounded-full z-10"><ChevronLeft className="w-8 h-8" /></button>
              <button onClick={(e) => { e.stopPropagation(); setSelected(s => (s + 1) % sorted.length); }} className="absolute right-4 text-white p-3 hover:bg-white/10 rounded-full z-10"><ChevronRight className="w-8 h-8" /></button>
            </>
          )}
          <div className="max-w-5xl max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
            <img src={current.url} alt={productName} className="max-w-full max-h-[90vh] object-contain rounded-lg" />
          </div>
          <div className="absolute bottom-6 text-white/60 text-sm font-medium">{selected + 1} / {sorted.length}</div>
        </div>
      )}
    </div>
  );
}
