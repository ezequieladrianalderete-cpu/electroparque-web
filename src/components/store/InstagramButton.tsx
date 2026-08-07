'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Instagram } from 'lucide-react';

export function InstagramButton() {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    supabase.from('store_settings').select('value').eq('key', 'instagram_url').single().then(({ data }) => { if (data?.value) setUrl(data.value); });
  }, []);

  if (!url) return null;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" title="Seguinos en Instagram"
      className="fixed bottom-24 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50"
      style={{ background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)' }}>
      <Instagram className="w-7 h-7 text-white" strokeWidth={2} />
    </a>
  );
}
