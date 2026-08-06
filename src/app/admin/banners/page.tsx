'use client';
import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { Plus, Trash2, Upload, ArrowLeft, ChevronUp, ChevronDown, Video, Smartphone, Pencil, Check, X } from 'lucide-react';
import Link from 'next/link';

type Placement = 'hero' | 'promo' | 'after_reviews';

const PLACEMENT_TABS: { value: Placement; label: string }[] = [
  { value: 'hero', label: 'Carrusel principal' },
  { value: 'promo', label: 'Banners con video' },
  { value: 'after_reviews', label: 'Debajo de las reseñas' },
];

const PLACEMENT_HELP: Record<Placement, string> = {
  hero: 'Todos los banners "Activo" rotan en la portada, arriba de todo. El orden de la lista es el orden en que se muestran — usá las flechas para acomodarlos.',
  promo: 'Estos banners aparecen apilados más abajo en la portada, antes del pie de página. Pueden tener un video de fondo (se recomienda corto y liviano) o solo una imagen.',
  after_reviews: 'Estos banners aparecen justo debajo de la sección de reseñas de clientes, antes de los videos de clientes. Mismo formato que los banners con video.',
};

export default function BannersPage() {
  const { supabase, loading: authLoading } = useAdmin();
  const [placement, setPlacement] = useState<Placement>('hero');
  const [banners, setBanners] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', subtitle: '', link_url: '', link_text: 'Ver producto' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageMobileFile, setImageMobileFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', subtitle: '', link_url: '', link_text: '' });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImageMobileFile, setEditImageMobileFile] = useState<File | null>(null);
  const [editVideoFile, setEditVideoFile] = useState<File | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => { if (!authLoading) load(); }, [authLoading, placement]);
  const load = async () => {
    setLoaded(false);
    const { data } = await supabase.from('banners').select('*').eq('placement', placement).order('sort_order');
    setBanners(data || []); setLoaded(true);
  };

  const add = async () => {
    if (!form.title.trim() && !imageFile && !videoFile) return;
    setSaving(true);
    let imageUrl = '';
    let imageMobileUrl = '';
    let videoUrl = '';
    if (imageFile) {
      const path = `banner-${Date.now()}.${imageFile.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('banners').upload(path, imageFile);
      if (!error) { const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(path); imageUrl = publicUrl; }
    }
    if (imageMobileFile) {
      const path = `banner-mobile-${Date.now()}.${imageMobileFile.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('banners').upload(path, imageMobileFile);
      if (!error) { const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(path); imageMobileUrl = publicUrl; }
    }
    if (placement !== 'hero' && videoFile) {
      const path = `banner-video-${Date.now()}.${videoFile.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('banners').upload(path, videoFile);
      if (!error) { const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(path); videoUrl = publicUrl; }
    }
    await supabase.from('banners').insert({
      title: form.title, subtitle: form.subtitle, image_url: imageUrl || '', image_mobile_url: imageMobileUrl || null, video_url: videoUrl || null,
      link_url: form.link_url, link_text: form.link_text, is_active: true, sort_order: banners.length, placement,
    });
    setForm({ title: '', subtitle: '', link_url: '', link_text: 'Ver producto' }); setImageFile(null); setImageMobileFile(null); setVideoFile(null); setPreview('');
    await load(); setSaving(false);
  };

  const remove = async (id: string) => { if (confirm('¿Eliminar banner?')) { await supabase.from('banners').delete().eq('id', id); await load(); } };
  const toggle = async (id: string, active: boolean) => { await supabase.from('banners').update({ is_active: !active }).eq('id', id); await load(); };
  const uploadMobileImage = async (id: string, file?: File) => {
    if (!file) return;
    const path = `banner-mobile-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('banners').upload(path, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(path);
      await supabase.from('banners').update({ image_mobile_url: publicUrl }).eq('id', id);
      await load();
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= banners.length) return;
    const reordered = [...banners];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    setBanners(reordered);
    await Promise.all(reordered.map((b, i) => supabase.from('banners').update({ sort_order: i }).eq('id', b.id)));
    await load();
  };

  const startEdit = (b: any) => {
    setEditingId(b.id);
    setEditForm({ title: b.title || '', subtitle: b.subtitle || '', link_url: b.link_url || '', link_text: b.link_text || '' });
    setEditImageFile(null); setEditImageMobileFile(null); setEditVideoFile(null);
  };
  const cancelEdit = () => setEditingId(null);
  const saveEdit = async (id: string) => {
    setEditSaving(true);
    const updates: any = { title: editForm.title, subtitle: editForm.subtitle, link_url: editForm.link_url, link_text: editForm.link_text };
    if (editImageFile) {
      const path = `banner-${Date.now()}.${editImageFile.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('banners').upload(path, editImageFile);
      if (!error) { const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(path); updates.image_url = publicUrl; }
    }
    if (editImageMobileFile) {
      const path = `banner-mobile-${Date.now()}.${editImageMobileFile.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('banners').upload(path, editImageMobileFile);
      if (!error) { const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(path); updates.image_mobile_url = publicUrl; }
    }
    if (placement !== 'hero' && editVideoFile) {
      const path = `banner-video-${Date.now()}.${editVideoFile.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('banners').upload(path, editVideoFile);
      if (!error) { const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(path); updates.video_url = publicUrl; }
    }
    await supabase.from('banners').update(updates).eq('id', id);
    setEditingId(null);
    await load(); setEditSaving(false);
  };

  if (authLoading || !loaded) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/admin/dashboard" className="p-2 border rounded-lg"><ArrowLeft className="w-4 h-4"/></Link>
        <h1 className="font-bold text-lg">Banners</h1>
      </div>
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="flex gap-2 bg-white border rounded-xl p-1.5 w-fit flex-wrap">
          {PLACEMENT_TABS.map(t => (
            <button key={t.value} onClick={() => { setPlacement(t.value); setEditingId(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${placement === t.value ? 'bg-ep-navy text-white' : 'text-gray-500 hover:bg-gray-50'}`}>{t.label}</button>
          ))}
        </div>
        <p className="text-sm text-gray-500">
          {PLACEMENT_HELP[placement]}
          {' '}Si tu foto es panorámica, subí también una versión vertical para celular — si no, en el teléfono se va a ver recortada.
        </p>

        <div className="bg-white rounded-xl border p-5 space-y-3">
          <h2 className="font-bold text-sm">Nuevo banner</h2>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.title} onChange={e => setForm(f=>({...f, title: e.target.value}))} className="input-field" placeholder="Título (opcional — se puede dejar solo la foto)"/>
            <input value={form.subtitle} onChange={e => setForm(f=>({...f, subtitle: e.target.value}))} className="input-field" placeholder="Subtítulo"/>
            <input value={form.link_url} onChange={e => setForm(f=>({...f, link_url: e.target.value}))} className="input-field" placeholder="Link (/productos/...)"/>
            <input value={form.link_text} onChange={e => setForm(f=>({...f, link_text: e.target.value}))} className="input-field" placeholder="Texto del botón"/>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex-1 min-w-[200px] border-2 border-dashed rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-ep-navy">
              <Upload className="w-5 h-5 text-gray-400"/><span className="text-sm text-gray-500">{imageFile ? imageFile.name : placement !== 'hero' ? 'Imagen de respaldo (1200×400)' : 'Subir imagen (1200×400)'}</span>
              <input type="file" accept="image/*" onChange={e => { const f=e.target.files?.[0]; if(f){setImageFile(f);setPreview(URL.createObjectURL(f));} }} className="hidden"/>
            </label>
            <label className="flex-1 min-w-[200px] border-2 border-dashed rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-ep-navy">
              <Smartphone className="w-5 h-5 text-gray-400"/><span className="text-sm text-gray-500">{imageMobileFile ? imageMobileFile.name : 'Imagen para celular (opcional)'}</span>
              <input type="file" accept="image/*" onChange={e => { const f=e.target.files?.[0]; if(f) setImageMobileFile(f); }} className="hidden"/>
            </label>
            {placement !== 'hero' && (
              <label className="flex-1 min-w-[200px] border-2 border-dashed rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-ep-navy">
                <Video className="w-5 h-5 text-gray-400"/><span className="text-sm text-gray-500">{videoFile ? videoFile.name : 'Subir video de fondo'}</span>
                <input type="file" accept="video/*" onChange={e => { const f=e.target.files?.[0]; if(f) setVideoFile(f); }} className="hidden"/>
              </label>
            )}
            <button onClick={add} disabled={saving} className="bg-ep-navy text-white font-bold px-6 py-3 rounded-xl disabled:opacity-50"><Plus className="w-4 h-4 inline mr-1"/>Crear</button>
          </div>
          {preview && <img src={preview} alt="Preview" className="w-full max-h-40 object-cover rounded-xl"/>}
        </div>

        <div className="space-y-3">
          {banners.map((b, i) => editingId === b.id ? (
            <div key={b.id} className="bg-white rounded-xl border-2 border-ep-navy p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input value={editForm.title} onChange={e => setEditForm(f=>({...f, title: e.target.value}))} className="input-field" placeholder="Título"/>
                <input value={editForm.subtitle} onChange={e => setEditForm(f=>({...f, subtitle: e.target.value}))} className="input-field" placeholder="Subtítulo"/>
                <input value={editForm.link_url} onChange={e => setEditForm(f=>({...f, link_url: e.target.value}))} className="input-field" placeholder="Link (/productos/...)"/>
                <input value={editForm.link_text} onChange={e => setEditForm(f=>({...f, link_text: e.target.value}))} className="input-field" placeholder="Texto del botón"/>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex-1 min-w-[180px] border-2 border-dashed rounded-xl p-2.5 flex items-center gap-2 cursor-pointer hover:border-ep-navy text-xs text-gray-500">
                  <Upload className="w-4 h-4 text-gray-400"/>{editImageFile ? editImageFile.name : 'Cambiar imagen (opcional)'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f=e.target.files?.[0]; if(f) setEditImageFile(f); }}/>
                </label>
                <label className="flex-1 min-w-[180px] border-2 border-dashed rounded-xl p-2.5 flex items-center gap-2 cursor-pointer hover:border-ep-navy text-xs text-gray-500">
                  <Smartphone className="w-4 h-4 text-gray-400"/>{editImageMobileFile ? editImageMobileFile.name : 'Cambiar imagen celular'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => { const f=e.target.files?.[0]; if(f) setEditImageMobileFile(f); }}/>
                </label>
                {placement !== 'hero' && (
                  <label className="flex-1 min-w-[180px] border-2 border-dashed rounded-xl p-2.5 flex items-center gap-2 cursor-pointer hover:border-ep-navy text-xs text-gray-500">
                    <Video className="w-4 h-4 text-gray-400"/>{editVideoFile ? editVideoFile.name : 'Cambiar video'}
                    <input type="file" accept="video/*" className="hidden" onChange={e => { const f=e.target.files?.[0]; if(f) setEditVideoFile(f); }}/>
                  </label>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={cancelEdit} className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-50 flex items-center gap-1"><X className="w-4 h-4"/>Cancelar</button>
                <button onClick={() => saveEdit(b.id)} disabled={editSaving} className="bg-ep-navy text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-1"><Check className="w-4 h-4"/>{editSaving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </div>
          ) : (
            <div key={b.id} className="bg-white rounded-xl border p-4 flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 rounded-md border text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed" title="Subir"><ChevronUp className="w-4 h-4"/></button>
                <button onClick={() => move(i, 1)} disabled={i === banners.length - 1} className="p-1 rounded-md border text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed" title="Bajar"><ChevronDown className="w-4 h-4"/></button>
              </div>
              <span className="text-xs font-bold text-gray-400 w-5 text-center">{i + 1}</span>
              <div className="w-32 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                {b.image_url ? <img src={b.image_url} alt="" className="w-full h-full object-cover"/> : <span className="text-gray-300">Sin imagen</span>}
                {b.video_url && <span className="absolute bottom-1 right-1 bg-black/60 text-white rounded p-0.5"><Video className="w-3 h-3"/></span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{b.title}</p>
                <p className="text-xs text-gray-400 truncate">{b.subtitle}</p>
              </div>
              <button onClick={() => startEdit(b)} className="p-2 rounded-lg border text-gray-500 hover:bg-gray-50 hover:text-ep-navy" title="Editar texto y link"><Pencil className="w-4 h-4"/></button>
              <label className={`p-2 rounded-lg border cursor-pointer hover:bg-gray-50 ${b.image_mobile_url ? 'text-ep-navy border-ep-navy/40' : 'text-gray-400'}`} title={b.image_mobile_url ? 'Cambiar imagen para celular' : 'Subir imagen para celular'}>
                <Smartphone className="w-4 h-4"/>
                <input type="file" accept="image/*" className="hidden" onChange={e => uploadMobileImage(b.id, e.target.files?.[0])}/>
              </label>
              <button onClick={() => toggle(b.id, b.is_active)} className={`text-xs font-bold px-3 py-1 rounded-full ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{b.is_active ? 'Activo' : 'Oculto'}</button>
              <button onClick={() => remove(b.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
            </div>
          ))}
          {banners.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">Todavía no hay banners acá.</p>}
        </div>
      </div>
    </div>
  );
}
