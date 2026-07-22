export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';

export default async function PublicacionesPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase.from('publications').select('*').order('created_at', { ascending: false });
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/admin/dashboard" className="p-2 border rounded-lg hover:bg-gray-50"><ArrowLeft className="w-4 h-4"/></Link>
        <h1 className="font-bold text-lg flex-1">Blog / Publicaciones</h1>
        <Link href="/admin/publicaciones/nueva" className="bg-ep-navy text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1"><Plus className="w-4 h-4"/>Nueva</Link>
      </div>
      <div className="max-w-4xl mx-auto p-6 space-y-3">
        {(posts||[]).map((p:any) => (
          <div key={p.id} className="bg-white rounded-xl border p-4 flex items-center gap-4">
            <div className="flex-1"><p className="font-semibold text-sm">{p.title}</p><p className="text-xs text-gray-400">{p.excerpt?.substring(0,80)}</p></div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${p.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.is_published ? 'Publicado' : 'Borrador'}</span>
          </div>
        ))}
        {(posts||[]).length === 0 && <p className="text-center text-gray-400 py-20">No hay publicaciones. <Link href="/admin/publicaciones/nueva" className="text-ep-navy font-semibold">Crear primera →</Link></p>}
      </div>
    </div>
  );
}
