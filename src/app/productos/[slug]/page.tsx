export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { ProductGallery } from '@/components/store/ProductGallery';
import { ProductInfo } from '@/components/store/ProductInfo';
import { ProductCard } from '@/components/store/ProductCard';
import { notFound } from 'next/navigation';
import type { Product } from '@/types';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('products').select('name,short_description').eq('slug', slug).single();
  return data ? { title: data.name, description: data.short_description } : { title: 'Producto no encontrado' };
}

export default async function ProductoPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase.from('products').select('*, category:categories(id,name,slug), images:product_images(*), variants:product_variants(*)').eq('slug', slug).eq('is_active', true).single();
  if (!product) notFound();
  const { data: reviews } = await supabase.from('reviews').select('*').eq('product_id', product.id).eq('is_approved', true).order('created_at', { ascending: false }).limit(10);
  const { data: related } = await supabase.from('products').select('*, category:categories(id,name,slug), images:product_images(*)').eq('is_active', true).neq('id', product.id).limit(4);
  const p = product as unknown as Product & { video_url?: string };
  const avg = reviews?.length ? (reviews.reduce((a:number,r:any) => a+r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div>
      <div className="bg-gray-50 border-b px-4 py-3"><div className="max-w-7xl mx-auto text-sm text-gray-500">
        <a href="/" className="hover:text-ep-navy">Inicio</a>{' / '}<a href="/productos" className="hover:text-ep-navy">Productos</a>
        {p.category && <>{' / '}<a href={`/productos?categoria=${p.category.slug}`} className="hover:text-ep-navy">{p.category.name}</a></>}
      </div></div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ProductGallery images={p.images || []} productName={p.name} />
          <ProductInfo product={p} reviews={reviews || []} avgRating={avg} />
        </div>

        {/* HTML Description */}
        {p.description && (
          <div className="mt-12 bg-gray-50 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-ep-navy mb-4">Descripción completa</h2>
            <div
              className="text-gray-700 leading-relaxed [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-ep-navy [&>h2]:mt-6 [&>h2]:mb-3 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:mt-4 [&>h3]:mb-2 [&>p]:mb-3 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-4 [&>ul>li]:mb-1 [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-4 [&>strong]:font-bold [&_a]:text-ep-navy [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: p.description }}
            />
          </div>
        )}

        {/* Video */}
        {p.video_url && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-ep-navy mb-4">🎬 Video</h2>
            <div className="aspect-video rounded-2xl overflow-hidden bg-black">
              {p.video_url.includes('youtube') || p.video_url.includes('youtu.be') ? (
                <iframe
                  src={`https://www.youtube.com/embed/${p.video_url.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1] || ''}`}
                  className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : (
                <video src={p.video_url} controls className="w-full h-full" />
              )}
            </div>
          </div>
        )}

        {reviews && reviews.length > 0 && (
          <div className="mt-16 border-t pt-12"><h2 className="text-xl font-bold mb-6">Opiniones ({reviews.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{reviews.map((r:any) => (
              <div key={r.id} className="border rounded-xl p-5"><div className="text-yellow-400 mb-2">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div><p className="text-sm text-gray-600 mb-3">&ldquo;{r.comment}&rdquo;</p><p className="text-sm font-semibold">{r.customer_name}</p></div>
            ))}</div>
          </div>
        )}
        {related && related.length > 0 && (
          <div className="mt-16 border-t pt-12"><h2 className="text-xl font-bold mb-6">También te puede interesar</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{(related as unknown as Product[]).map(rp => <ProductCard key={rp.id} product={rp} />)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
