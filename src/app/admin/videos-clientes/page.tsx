'use client';
import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { Plus, Trash2, Upload, ArrowLeft, ChevronUp, ChevronDown, Video } from 'lucide-react';
import Link from 'next/link';

export default function VideosClientesPage() {
  const { supabase, loading: authLoading } = useAdmin();
  const [videos, setVideos] = useState<any[]>([]);
  const [caption, setCaption] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { if (!authLoading) load(); }, [authLoading]);
  const load = async () => {
    const { data } = await supabase.from('video_testimonials').select('*').order('sort_order');
    setVideos(data || []); setLoaded(true);
  };

  const add = async () => {
    if (!videoFile) return;
    setSaving(true);
    const path = `testimonial-${Date.now()}.${videoFile.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('products').upload(path, videoFile);
    if (error) { setSaving(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(path);

    let thumbUrl = '';
    if (thumbFile) {
      const tPath = `testimonial-thumb-${Date.now()}.${thumbFile.name.split('.').pop()}`;
      const { error: tErr } = await supabase.storage.from('products').upload(tPath, thumbFile);
      if (!tErr) { const { data: { publicUrl: tUrl } } = supabase.storage.from('products').getPublicUrl(tPath); thumbUrl = tUrl; }
    }

    await supabase.from('video_testimonials').insert({ caption: caption || null, video_url: publicUrl, thumbnail_url: thumbUrl || null, is_active: true, sort_order: videos.length });
    setCaption(''); setVideoFile(null); setThumbFile(null);
    await load(); setSaving(false);
  };

  const remove = async (id: string) => { if (confirm('¿Eliminar este video?')) { await supabase.from('video_testimonials').delete().eq('id', id); await load(); } };
  const toggle = async (id: string, active: boolean) => { await supabase.from('video_testimonials').update({ is_active: !active }).eq('id', id); await load(); };
  const move = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= videos.length) return;
    const reordered = [...videos];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    setVideos(reordered);
    await Promise.all(reordered.map((v, i) => supabase.from('video_testimonials').update({ sort_order: i }).eq('id', v.id)));
    await load();
  };

  if (authLoading || !loaded) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/admin/dashboard" className="p-2 border rounded-lg"><ArrowLeft className="w-4 h-4"/></Link>
        <h1 className="font-bold text-lg">Videos de clientes ({videos.length})</h1>
      </div>
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <p className="text-sm text-gray-500">Aparecen en la portada en una fila que se puede desplazar con flechas — pensado para videos verticales (tipo celular), cortos, de clientes mostrando el producto.</p>

        <div className="bg-white rounded-xl border p-5 space-y-3">
          <h2 className="font-bold text-sm">Nuevo video</h2>
          <input value={caption} onChange={e => setCaption(e.target.value)} className="input-field" placeholder="Texto debajo del video (opcional, ej: nombre del cliente)"/>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex-1 min-w-[200px] border-2 border-dashed rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-ep-navy">
              <Video className="w-5 h-5 text-gray-400"/><span className="text-sm text-gray-500">{videoFile ? videoFile.name : 'Subir video (vertical)'}</span>
              <input type="file" accept="video/*" onChange={e => { const f=e.target.files?.[0]; if(f) setVideoFile(f); }} className="hidden"/>
            </label>
            <label className="flex-1 min-w-[200px] border-2 border-dashed rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-ep-navy">
              <Upload className="w-5 h-5 text-gray-400"/><span className="text-sm text-gray-500">{thumbFile ? thumbFile.name : 'Miniatura (opcional)'}</span>
              <input type="file" accept="image/*" onChange={e => { const f=e.target.files?.[0]; if(f) setThumbFile(f); }} className="hidden"/>
            </label>
            <button onClick={add} disabled={saving || !videoFile} className="bg-ep-navy text-white font-bold px-6 py-3 rounded-xl disabled:opacity-50"><Plus className="w-4 h-4 inline mr-1"/>Agregar</button>
          </div>
        </div>

        <div className="space-y-3">
          {videos.map((v, i) => (
            <div key={v.id} className="bg-white rounded-xl border p-4 flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <button onClick={() => move(i, -1)} disabled={i===0} className="p-1 rounded-md border text-gray-500 hover:bg-gray-50 disabled:opacity-30"><ChevronUp className="w-4 h-4"/></button>
                <button onClick={() => move(i, 1)} disabled={i===videos.length-1} className="p-1 rounded-md border text-gray-500 hover:bg-gray-50 disabled:opacity-30"><ChevronDown className="w-4 h-4"/></button>
              </div>
              <div className="w-12 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                {v.thumbnail_url ? <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover"/> : <Video className="w-5 h-5 text-gray-400"/>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{v.caption || '(sin descripción)'}</p>
              </div>
              <button onClick={() => toggle(v.id, v.is_active)} className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${v.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{v.is_active ? 'Activo' : 'Oculto'}</button>
              <button onClick={() => remove(v.id)} className="text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 className="w-4 h-4"/></button>
            </div>
          ))}
          {videos.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">Todavía no hay videos cargados.</p>}
        </div>
      </div>
    </div>
  );
}
