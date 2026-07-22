'use client';
import { useState } from 'react';
import Image from 'next/image';
import type { ProductImage } from '@/types';

export function ProductGallery({ images, productName }: { images: ProductImage[]; productName: string }) {
  const sorted = [...images].sort((a, b) => (a.is_primary ? -1 : b.is_primary ? 1 : a.sort_order - b.sort_order));
  const [selected, setSelected] = useState(0);
  const current = sorted[selected];

  return (
    <div>
      <div className="aspect-square bg-gray-50 rounded-2xl flex items-center justify-center relative overflow-hidden border">
        {current ? (
          <Image src={current.url} alt={current.alt || productName} fill className="object-cover" />
        ) : (
          <span className="text-8xl">📦</span>
        )}
      </div>
      {sorted.length > 1 && (
        <div className="flex gap-2 mt-3">
          {sorted.map((img, i) => (
            <button key={img.id} onClick={() => setSelected(i)}
              className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${i === selected ? 'border-ep-navy' : 'border-gray-200'}`}>
              <Image src={img.url} alt={img.alt || ''} width={64} height={64} className="object-cover w-full h-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
