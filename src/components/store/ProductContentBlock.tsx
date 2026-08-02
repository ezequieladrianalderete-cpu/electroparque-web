import type { ProductContentBlock as ContentBlock } from '@/types';

export function ProductContentBlock({ block, reverse }: { block: ContentBlock; reverse?: boolean }) {
  return (
    <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
      <div className={`w-full md:w-1/2 ${reverse ? 'md:order-2' : ''}`}>
        {block.video_url ? (
          <video className="w-full rounded-2xl shadow-sm" src={block.video_url} controls autoPlay muted loop playsInline poster={block.image_url || undefined} />
        ) : block.image_url ? (
          <img src={block.image_url} alt={block.title || ''} className="w-full rounded-2xl shadow-sm object-cover" />
        ) : null}
      </div>
      <div className={`w-full md:w-1/2 ${reverse ? 'md:order-1' : ''}`}>
        {block.title && <h3 className="text-2xl font-bold text-ep-navy mb-3">{block.title}</h3>}
        {block.description && <p className="text-gray-600 leading-relaxed whitespace-pre-line">{block.description}</p>}
      </div>
    </div>
  );
}
