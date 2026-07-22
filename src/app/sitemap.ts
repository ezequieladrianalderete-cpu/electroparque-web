export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import type { MetadataRoute } from 'next';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://electroparque-web.vercel.app';
  const supabase = await createClient();
  const [{ data: products }, { data: pubs }] = await Promise.all([
    supabase.from('products').select('slug,updated_at').eq('is_active', true),
    supabase.from('publications').select('slug,updated_at').eq('is_published', true),
  ]);
  return [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/productos`, changeFrequency: 'daily', priority: 0.9 },
    ...(products||[]).map(p => ({ url: `${base}/productos/${p.slug}`, lastModified: new Date(p.updated_at), priority: 0.8 as const })),
    ...(pubs||[]).map(p => ({ url: `${base}/blog/${p.slug}`, lastModified: new Date(p.updated_at), priority: 0.6 as const })),
  ];
}
