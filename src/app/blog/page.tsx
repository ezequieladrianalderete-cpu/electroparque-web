export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function BlogPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase.from('publications').select('*').eq('is_published', true).order('published_at', { ascending: false });
  return (<div className="max-w-4xl mx-auto px-4 py-10">
    <h1 className="text-3xl font-extrabold text-ep-navy mb-8">Blog</h1>
    {(posts||[]).length > 0 ? posts!.map((p:any)=>(
      <Link key={p.id} href={`/blog/${p.slug}`} className="block bg-white border rounded-xl p-5 mb-4 hover:shadow-md transition-shadow">
        <h2 className="text-lg font-bold text-gray-900 hover:text-ep-navy">{p.title}</h2>
        {p.excerpt && <p className="text-sm text-gray-500 mt-1">{p.excerpt}</p>}
      </Link>
    )) : <p className="text-center text-gray-400 py-20">Pronto publicaremos artículos.</p>}
  </div>);
}
