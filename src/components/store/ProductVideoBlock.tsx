import type { ProductContentBlock as ContentBlock } from '@/types';

export function ProductVideoBlock({ block }: { block: ContentBlock }) {
  return (
    <section className="relative overflow-hidden text-white px-4 py-14 sm:py-16 min-h-[380px] sm:min-h-[460px] md:min-h-[520px] flex items-center">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={block.video_url!}
        poster={block.image_url || undefined}
        autoPlay muted loop playsInline
      />
      <div className="absolute inset-0 bg-gradient-to-br from-ep-navy/60 via-ep-navy/40 to-black/45" />
      <div className="max-w-3xl mx-auto text-center relative z-10 w-full">
        {block.title && <h3 className="text-3xl sm:text-4xl font-extrabold mb-3">{block.title}</h3>}
        {block.description && <p className="text-white/85 text-lg leading-relaxed whitespace-pre-line">{block.description}</p>}
      </div>
    </section>
  );
}
