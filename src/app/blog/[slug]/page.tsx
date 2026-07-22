export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

interface Props { params: Promise<{ slug: string }> }

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase.from('publications').select('*').eq('slug', slug).eq('is_published', true).single();
  if (!post) notFound();
  return (<div className="max-w-3xl mx-auto px-4 py-10">
    <a href="/blog" className="text-ep-navy text-sm font-medium mb-4 block">← Volver al blog</a>
    <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{post.title}</h1>
    <div className="prose" dangerouslySetInnerHTML={{ __html: post.content }} />
  </div>);
}
