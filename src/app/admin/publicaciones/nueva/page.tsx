'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NuevaPublicacionPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title:'', slug:'', excerpt:'', content:'', is_published: false });
  const set = (k:string) => (e:any) => setForm(f => ({...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value, ...(k==='title' ? {slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,'-')} : {})}));

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('publications').insert({
      ...form, published_at: form.is_published ? new Date().toISOString() : null
    });
    if (error) { alert('Error: ' + error.message); setSaving(false); return; }
    alert('Publicación creada!'); router.push('/admin/publicaciones');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/admin/publicaciones" className="p-2 border rounded-lg hover:bg-gray-50"><ArrowLeft className="w-4 h-4"/></Link>
        <h1 className="font-bold text-lg flex-1">Nueva publicación</h1>
        <button onClick={save} disabled={saving} className="bg-ep-navy text-white px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50"><Save className="w-4 h-4"/>{saving?'Guardando...':'Guardar'}</button>
      </div>
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="bg-white rounded-xl border p-5 space-y-3">
          <div><label className="label">Título *</label><input value={form.title} onChange={set('title')} className="input-field" placeholder="Título del artículo"/></div>
          <div><label className="label">Slug</label><input value={form.slug} onChange={set('slug')} className="input-field font-mono text-xs text-gray-500"/></div>
          <div><label className="label">Extracto</label><textarea value={form.excerpt} onChange={set('excerpt')} rows={2} className="input-field resize-none" placeholder="Resumen corto..."/></div>
          <div><label className="label">Contenido (HTML)</label><textarea value={form.content} onChange={set('content')} rows={15} className="input-field resize-none font-mono text-xs" placeholder="<h2>Título</h2><p>Contenido del artículo...</p>"/></div>
          <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50">
            <input type="checkbox" checked={form.is_published} onChange={set('is_published')} className="w-4 h-4 accent-ep-navy"/>
            <span className="text-sm font-medium">Publicar inmediatamente</span>
          </label>
        </div>
      </div>
    </div>
  );
}
