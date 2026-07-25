'use client';
import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { Plus, Trash2, Upload, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BannersPage() {
  const { supabase, loading: authLoading } = useAdmin();
  const [banners, setBanners] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', subtitle: '', link_url: '', link_text: 'Ver producto', video_url: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { if (!authLoading) load(); }, [authLoading]);
  const load = async () => { const { data } = await supabase.from('banners').select('*').order('sort_order'); setBanners(data || []); setLoaded(true); };

  const add = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    let imageUrl = '';
    if (imageFile) {
      const path = `banner-${Date.now()}.${imageFile.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('banners').upload(path, imageFile);
      if (!error) { const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(path); imageUrl = publicUrl; }
    }
    await supabase.from('banners').insert({ title: form.title, subtitle: form.subtitle, image_url: imageUrl || '', link_url: form.link_url, link_text: form.link_text, is_active: true, sort_order: banners.length });
    setForm({ title: '', subtitle: '', link_url: '', link_text: 'Ver producto', video_url: '' }); setImageFile(null); setPreview('');
    await load(); setSaving(false);
  };

  const remove = async (id: string) => { if (confirm('¿Eliminar banner?')) { await supabase.from('banners').delete().eq('id', id); await load(); } };
  const toggle = async (id: string, active: boolean) => { await supabase.from('banners').update({ is_active: !active }).eq('id', id); await load(); };

  if (authLoading || !loaded) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/admin/dashboard" className="p-2 border rounded-lg"><ArrowLeft className="w-4 h-4"/></Link>
        <h1 className="font-bold text-lg">Banners ({banners.length})</h1>
      </div>
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="bg-white rounded-xl border p-5 space-y-3">
          <h2 className="font-bold text-sm">Nuevo banner</h2>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.title} onChange={e => setForm(f=>({...f, title: e.target.value}))} className="input-field" placeholder="Título"/>
            <input value={form.subtitle} onChange={e => setForm(f=>({...f, subtitle: e.target.value}))} className="input-field" placeholder="Subtítulo"/>
            <input value={form.link_url} onChange={e => setForm(f=>({...f, link_url: e.target.value}))} className="input-field" placeholder="Link (/productos/...)"/>
            <input value={form.link_text} onChange={e => setForm(f=>({...f, link_text: e.target.value}))} className="input-field" placeholder="Texto del botón"/>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex-1 border-2 border-dashed rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-ep-navy">
              <Upload className="w-5 h-5 text-gray-400"/><span className="text-sm text-gray-500">{imageFile ? imageFile.name : 'Subir imagen (1200×400)'}</span>
              <input type="file" accept="image/*" onChange={e => { const f=e.target.files?.[0]; if(f){setImageFile(f);setPreview(URL.createObjectURL(f));} }} className="hidden"/>
            </label>
            <button onClick={add} disabled={saving} className="bg-ep-navy text-white font-bold px-6 py-3 rounded-xl disabled:opacity-50"><Plus className="w-4 h-4 inline mr-1"/>Crear</button>
          </div>
          {preview && <img src={preview} alt="Preview" className="w-full max-h-40 object-cover rounded-xl"/>}
        </div>
        <div className="space-y-3">
          {banners.map(b => (
            <div key={b.id} className="bg-white rounded-xl border p-4 flex items-center gap-4">
              <div className="w-32 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                {b.image_url ? <img src={b.image_url} alt="" className="w-full h-full object-cover"/> : <span className="text-gray-300">Sin imagen</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{b.title}</p>
                <p className="text-xs text-gray-400 truncate">{b.subtitle}</p>
              </div>
              <button onClick={() => toggle(b.id, b.is_active)} className={`text-xs font-bold px-3 py-1 rounded-full ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{b.is_active ? 'Activo' : 'Oculto'}</button>
              <button onClick={() => remove(b.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
