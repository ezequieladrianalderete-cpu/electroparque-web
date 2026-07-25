'use client';
import { useState } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import type { ProductImage } from '@/types';

export function ProductGallery({ images, productName, videoUrl }: { images: ProductImage[]; productName: string; videoUrl?: string }) {
  const sorted = [...images].sort((a, b) => (a.is_primary ? -1 : b.is_primary ? 1 : a.sort_order - b.sort_order));
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const current = sorted[selected];

  const youtubeId = videoUrl?.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1];

  return (
    <div>
      {/* Main image */}
      <div className="aspect-square bg-gray-50 rounded-2xl flex items-center justify-center relative overflow-hidden border cursor-pointer" onClick={() => setLightbox(true)}>
        {current ? (
          <Image src={current.url} alt={current.alt || productName} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
        ) : (
          <span className="text-8xl">📦</span>
        )}
        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-lg">🔍 Click para ampliar</div>
      </div>

      {/* Thumbnails + video */}
      <div className="flex gap-2 mt-3 overflow-x-auto">
        {sorted.map((img, i) => (
          <button key={img.id} onClick={() => { setSelected(i); setShowVideo(false); }}
            className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${i === selected && !showVideo ? 'border-ep-navy' : 'border-gray-200'}`}>
            <Image src={img.url} alt={img.alt || ''} width={64} height={64} className="object-cover w-full h-full" />
          </button>
        ))}
        {videoUrl && (
          <button onClick={() => setShowVideo(true)}
            className={`w-16 h-16 rounded-lg border-2 flex-shrink-0 flex items-center justify-center bg-gray-900 ${showVideo ? 'border-ep-red' : 'border-gray-200'}`}>
            <Play className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Video player */}
      {showVideo && videoUrl && (
        <div className="mt-4 aspect-video rounded-xl overflow-hidden bg-black">
          {youtubeId ? (
            <iframe src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`} className="w-full h-full" allowFullScreen />
          ) : (
            <video src={videoUrl} controls autoPlay className="w-full h-full" />
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && current && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center" onClick={() => setLightbox(false)}>
          <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
          {sorted.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setSelected(s => (s - 1 + sorted.length) % sorted.length); }} className="absolute left-4 text-white p-2 hover:bg-white/10 rounded-full"><ChevronLeft className="w-8 h-8" /></button>
              <button onClick={(e) => { e.stopPropagation(); setSelected(s => (s + 1) % sorted.length); }} className="absolute right-4 text-white p-2 hover:bg-white/10 rounded-full"><ChevronRight className="w-8 h-8" /></button>
            </>
          )}
          <div className="max-w-4xl max-h-[85vh] relative" onClick={e => e.stopPropagation()}>
            <img src={current.url} alt={productName} className="max-w-full max-h-[85vh] object-contain" />
          </div>
          <div className="absolute bottom-4 text-white/60 text-sm">{selected + 1} / {sorted.length}</div>
        </div>
      )}
    </div>
  );
}
