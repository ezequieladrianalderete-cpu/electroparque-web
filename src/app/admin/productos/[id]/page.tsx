'use client';
import { useState, useEffect, use } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { Upload, X, Plus, Trash2, ArrowLeft, Save, Film, ChevronUp, ChevronDown, Video, HelpCircle } from 'lucide-react';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { supabase, loading: authLoading } = useAdmin();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState<any>(null);
  const [cats, setCats] = useState<any[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [newImages, setNewImages] = useState<{file:File;preview:string}[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [specs, setSpecs] = useState<{key:string;value:string}[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [blockForm, setBlockForm] = useState({ title: '', description: '' });
  const [blockImageFile, setBlockImageFile] = useState<File | null>(null);
  const [blockVideoFile, setBlockVideoFile] = useState<File | null>(null);
  const [blockSaving, setBlockSaving] = useState(false);
  const [faqs, setFaqs] = useState<any[]>([]);
  const [faqForm, setFaqForm] = useState({ question: '', answer: '' });
  const [faqSaving, setFaqSaving] = useState(false);

  useEffect(() => { if (!authLoading) load(); }, [authLoading]);

  const load = async () => {
    const [{ data: product }, { data: images }, { data: vars }, { data: categories }, { data: contentBlocks }, { data: productFaqs }] = await Promise.all([
      supabase.from('products').select('*').eq('id', id).single(),
      supabase.from('product_images').select('*').eq('product_id', id).order('sort_order'),
      supabase.from('product_variants').select('*').eq('product_id', id).order('sort_order'),
      supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('product_content_blocks').select('*').eq('product_id', id).order('sort_order'),
      supabase.from('faqs').select('*').eq('product_id', id).order('sort_order'),
    ]);
    if (!product) { router.push('/admin/productos'); return; }
    setForm({ ...product, tags: product.tags?.join(', ') || '' });
    setExistingImages(images || []);
    setVariants((vars || []).map((v:any) => ({ ...v, price_modifier: String(v.price_modifier), stock: String(v.stock) })));
    setSpecs(product.specs ? Object.entries(product.specs).map(([key, value]) => ({ key, value: value as string })) : []);
    setCats(categories || []);
    setBlocks(contentBlocks || []);
    setFaqs(productFaqs || []);
  };

  const addFaq = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) return;
    setFaqSaving(true);
    await supabase.from('faqs').insert({ product_id: id, question: faqForm.question, answer: faqForm.answer, is_active: true, sort_order: faqs.length });
    setFaqForm({ question: '', answer: '' });
    await load(); setFaqSaving(false);
  };
  const removeFaq = async (faqId: string) => { if (confirm('¿Eliminar esta pregunta?')) { await supabase.from('faqs').delete().eq('id', faqId); await load(); } };
  const toggleFaq = async (faqId: string, active: boolean) => { await supabase.from('faqs').update({ is_active: !active }).eq('id', faqId); await load(); };
  const moveFaq = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= faqs.length) return;
    const reordered = [...faqs];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    setFaqs(reordered);
    await Promise.all(reordered.map((f, i) => supabase.from('faqs').update({ sort_order: i }).eq('id', f.id)));
    await load();
  };

  const addBlock = async () => {
    if (!blockForm.title.trim() && !blockImageFile && !blockVideoFile) return;
    setBlockSaving(true);
    let imageUrl = '';
    let videoUrl = '';
    if (blockImageFile) {
      const path = `blocks/${id}-${Date.now()}.${blockImageFile.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('products').upload(path, blockImageFile);
      if (!error) { const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(path); imageUrl = publicUrl; }
    }
    if (blockVideoFile) {
      const path = `blocks/${id}-${Date.now()}-video.${blockVideoFile.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('products').upload(path, blockVideoFile);
      if (!error) { const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(path); videoUrl = publicUrl; }
    }
    await supabase.from('product_content_blocks').insert({
      product_id: id, title: blockForm.title || null, description: blockForm.description || null,
      image_url: imageUrl || null, video_url: videoUrl || null, is_active: true, sort_order: blocks.length,
    });
    setBlockForm({ title: '', description: '' }); setBlockImageFile(null); setBlockVideoFile(null);
    await load(); setBlockSaving(false);
  };

  const removeBlock = async (blockId: string) => { if (confirm('¿Eliminar este bloque?')) { await supabase.from('product_content_blocks').delete().eq('id', blockId); await load(); } };
  const toggleBlock = async (blockId: string, active: boolean) => { await supabase.from('product_content_blocks').update({ is_active: !active }).eq('id', blockId); await load(); };
  const moveBlock = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const reordered = [...blocks];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    setBlocks(reordered);
    await Promise.all(reordered.map((b, i) => supabase.from('product_content_blocks').update({ sort_order: i }).eq('id', b.id)));
    await load();
  };

  const set = (k:string) => (e:any) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f:any) => ({ ...f, [k]: val }));
  };

  const save = async () => {
    setSaving(true); setMsg('');
    const specsObj: Record<string,string> = {};
    specs.filter(s => s.key.trim()).forEach(s => specsObj[s.key] = s.value);

    let videoUrl = form.video_url || null;
    if (videoFile) {
      const ext = videoFile.name.split('.').pop();
      const path = `videos/${id}-${Date.now()}.${ext}`;
      const { error: vErr } = await supabase.storage.from('products').upload(path, videoFile);
      if (!vErr) {
        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(path);
        videoUrl = publicUrl;
      } else { setMsg('Error subiendo video: ' + vErr.message); setSaving(false); return; }
    }

    const { error } = await supabase.from('products').update({
      name: form.name, slug: form.slug, short_description: form.short_description,
      description: form.description, price: parseFloat(form.price),
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      sku: form.sku || null, category_id: form.category_id || null,
      is_active: form.is_active, is_featured: form.is_featured,
      tags: form.tags ? form.tags.split(',').map((t:string) => t.trim()) : [],
      specs: specsObj, video_url: videoUrl,
    }).eq('id', id);

    if (error) { setMsg('Error: ' + error.message); setSaving(false); return; }

    for (let i = 0; i < newImages.length; i++) {
      const ext = newImages[i].file.name.split('.').pop();
      const path = `${id}/${Date.now()}-${i}.${ext}`;
      const { error: upErr } = await supabase.storage.from('products').upload(path, newImages[i].file);
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(path);
        await supabase.from('product_images').insert({ product_id: id, url: publicUrl, is_primary: existingImages.length === 0 && i === 0, sort_order: existingImages.length + i });
      }
    }

    await supabase.from('product_variants').delete().eq('product_id', id);
    for (const v of variants.filter(v => v.name?.trim() && v.value?.trim())) {
      await supabase.from('product_variants').insert({ product_id: id, name: v.name, value: v.value, price_modifier: parseFloat(v.price_modifier) || 0, stock: parseInt(v.stock) || 0 });
    }

    setMsg('✅ Producto actualizado');
    setNewImages([]); setVideoFile(null);
    await load();
    setSaving(false);
  };

  const deleteImage = async (imgId: string) => { await supabase.from('product_images').delete().eq('id', imgId); await load(); };

  if (authLoading || !form) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <button onClick={() => router.push('/admin/productos')} className="p-2 border rounded-lg"><ArrowLeft className="w-4 h-4"/></button>
        <div className="flex-1"><h1 className="font-bold text-lg">Editar producto</h1><p className="text-xs text-gray-500 truncate">{form.name}</p></div>
        <button onClick={save} disabled={saving} className="bg-ep-navy text-white px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50"><Save className="w-4 h-4"/>{saving ? 'Guardando...' : 'Guardar'}</button>
      </div>
      <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {msg && <div className={`p-3 rounded-xl text-sm ${msg.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>{msg}</div>}

          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="font-bold text-sm">📋 Información</h2>
            <div><label className="label">Nombre</label><input value={form.name||''} onChange={set('name')} className="input-field"/></div>
            <div><label className="label">Slug</label><input value={form.slug||''} onChange={set('slug')} className="input-field font-mono text-xs"/></div>
            <div><label className="label">Descripción corta</label><textarea value={form.short_description||''} onChange={set('short_description')} rows={2} className="input-field resize-none"/></div>
            <div><label className="label">Descripción HTML</label><textarea value={form.description||''} onChange={set('description')} rows={10} className="input-field resize-none font-mono text-xs" placeholder="<h2>Título</h2><p>Texto</p>"/></div>
            <div><label className="label">Tags</label><input value={form.tags||''} onChange={set('tags')} className="input-field"/></div>
          </div>

          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-bold text-sm mb-3">📸 Fotos</h2>
            <div className="grid grid-cols-4 gap-3">
              {existingImages.map(img => (
                <div key={img.id} className="aspect-square rounded-lg border-2 border-gray-200 overflow-hidden relative group">
                  <img src={img.url} alt="" className="w-full h-full object-cover"/>
                  {img.is_primary && <span className="absolute top-1 left-1 bg-ep-navy text-white text-[8px] font-bold px-1.5 py-0.5 rounded">Principal</span>}
                  <button onClick={() => deleteImage(img.id)} className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"><X className="w-3 h-3"/></button>
                </div>
              ))}
              {newImages.map((img,i) => (
                <div key={i} className="aspect-square rounded-lg border-2 border-green-400 overflow-hidden relative group">
                  <img src={img.preview} alt="" className="w-full h-full object-cover"/>
                  <span className="absolute top-1 left-1 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">Nueva</span>
                  <button onClick={() => setNewImages(p => p.filter((_,j) => j!==i))} className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"><X className="w-3 h-3"/></button>
                </div>
              ))}
              <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-ep-navy">
                <Upload className="w-6 h-6 text-gray-400 mb-1"/><span className="text-[10px] text-gray-400">Agregar</span>
                <input type="file" accept="image/*" multiple onChange={e => Array.from(e.target.files||[]).forEach(f => setNewImages(p => [...p, {file:f, preview:URL.createObjectURL(f)}]))} className="hidden"/>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="font-bold text-sm flex items-center gap-2"><Film className="w-4 h-4"/>Video</h2>
            {form.video_url && <p className="text-xs text-green-600 bg-green-50 p-2 rounded-lg">✅ Video actual: {form.video_url.substring(0,60)}...</p>}
            <div><label className="label">URL de YouTube</label><input value={form.video_url||''} onChange={set('video_url')} className="input-field" placeholder="https://youtube.com/watch?v=..."/></div>
            <div className="text-center text-gray-400 text-xs">— o subir desde mi dispositivo —</div>
            <label className="block border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-ep-navy transition-colors">
              <Film className="w-6 h-6 text-gray-400 mx-auto mb-1"/>
              <span className="text-sm text-gray-500">{videoFile ? `✅ ${videoFile.name} (${(videoFile.size/1024/1024).toFixed(1)}MB)` : 'Subir video desde galería'}</span>
              <input type="file" accept="video/*" onChange={e => { const f=e.target.files?.[0]; if(f) { setVideoFile(f); setForm((fo:any)=>({...fo, video_url:''})); } }} className="hidden"/>
            </label>
            {videoFile && <button onClick={() => setVideoFile(null)} className="text-red-500 text-xs font-medium">✕ Quitar video</button>}
            {form.video_url && !videoFile && <button onClick={() => setForm((f:any)=>({...f, video_url:''}))} className="text-red-500 text-xs font-medium">✕ Quitar video actual</button>}
          </div>

          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="font-bold text-sm">🧩 Bloques explicativos</h2>
            <p className="text-xs text-gray-400">Se muestran uno debajo del otro en la ficha del producto, antes de las opiniones — para explicar el producto con fotos, videos y texto (como en las páginas de producto de otras tiendas grandes).</p>

            <div className="border-2 border-dashed rounded-xl p-4 space-y-2">
              <input value={blockForm.title} onChange={e => setBlockForm(f => ({...f, title: e.target.value}))} className="input-field text-sm" placeholder="Título (ej: Batería de larga duración)"/>
              <textarea value={blockForm.description} onChange={e => setBlockForm(f => ({...f, description: e.target.value}))} className="input-field text-sm resize-none" rows={2} placeholder="Texto explicativo"/>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="flex-1 min-w-[140px] border rounded-lg p-2 flex items-center gap-2 cursor-pointer hover:border-ep-navy text-xs text-gray-500">
                  <Upload className="w-4 h-4 text-gray-400"/>{blockImageFile ? blockImageFile.name : 'Imagen'}
                  <input type="file" accept="image/*" onChange={e => { const f=e.target.files?.[0]; if(f) setBlockImageFile(f); }} className="hidden"/>
                </label>
                <label className="flex-1 min-w-[140px] border rounded-lg p-2 flex items-center gap-2 cursor-pointer hover:border-ep-navy text-xs text-gray-500">
                  <Video className="w-4 h-4 text-gray-400"/>{blockVideoFile ? blockVideoFile.name : 'Video (opcional)'}
                  <input type="file" accept="video/*" onChange={e => { const f=e.target.files?.[0]; if(f) setBlockVideoFile(f); }} className="hidden"/>
                </label>
                <button onClick={addBlock} disabled={blockSaving} className="bg-ep-navy text-white font-bold px-4 py-2 rounded-lg text-xs disabled:opacity-50"><Plus className="w-3 h-3 inline mr-1"/>Agregar</button>
              </div>
            </div>

            {blocks.map((b, i) => (
              <div key={b.id} className="flex items-center gap-3 border rounded-xl p-3">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveBlock(i, -1)} disabled={i===0} className="p-0.5 rounded border text-gray-500 hover:bg-gray-50 disabled:opacity-30"><ChevronUp className="w-3 h-3"/></button>
                  <button onClick={() => moveBlock(i, 1)} disabled={i===blocks.length-1} className="p-0.5 rounded border text-gray-500 hover:bg-gray-50 disabled:opacity-30"><ChevronDown className="w-3 h-3"/></button>
                </div>
                <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {b.image_url ? <img src={b.image_url} alt="" className="w-full h-full object-cover"/> : b.video_url ? <Video className="w-5 h-5 text-gray-400"/> : <span className="text-gray-300 text-[9px]">Sin imagen</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs truncate">{b.title || '(sin título)'}</p>
                  <p className="text-[11px] text-gray-400 truncate">{b.description}</p>
                </div>
                <button onClick={() => toggleBlock(b.id, b.is_active)} className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{b.is_active ? 'Activo' : 'Oculto'}</button>
                <button onClick={() => removeBlock(b.id)} className="text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
            {blocks.length === 0 && <p className="text-center text-gray-400 text-xs py-4">Todavía no hay bloques.</p>}
          </div>

          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="font-bold text-sm flex items-center gap-2"><HelpCircle className="w-4 h-4"/>Preguntas frecuentes de este producto</h2>
            <p className="text-xs text-gray-400">Aparecen al final de la ficha de este producto. Para preguntas generales de la tienda (envíos, pagos, etc.) usá <a href="/admin/faqs" className="text-ep-navy underline">Preguntas frecuentes</a> en el menú.</p>
            <div className="border-2 border-dashed rounded-xl p-4 space-y-2">
              <input value={faqForm.question} onChange={e => setFaqForm(f => ({...f, question: e.target.value}))} className="input-field text-sm" placeholder="¿Cuánto dura la batería?"/>
              <textarea value={faqForm.answer} onChange={e => setFaqForm(f => ({...f, answer: e.target.value}))} className="input-field text-sm resize-none" rows={2} placeholder="Hasta 8 horas de uso continuo..."/>
              <button onClick={addFaq} disabled={faqSaving} className="bg-ep-navy text-white font-bold px-4 py-2 rounded-lg text-xs disabled:opacity-50"><Plus className="w-3 h-3 inline mr-1"/>Agregar</button>
            </div>
            {faqs.map((f, i) => (
              <div key={f.id} className="flex items-start gap-3 border rounded-xl p-3">
                <div className="flex flex-col gap-0.5 mt-0.5">
                  <button onClick={() => moveFaq(i, -1)} disabled={i===0} className="p-0.5 rounded border text-gray-500 hover:bg-gray-50 disabled:opacity-30"><ChevronUp className="w-3 h-3"/></button>
                  <button onClick={() => moveFaq(i, 1)} disabled={i===faqs.length-1} className="p-0.5 rounded border text-gray-500 hover:bg-gray-50 disabled:opacity-30"><ChevronDown className="w-3 h-3"/></button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs">{f.question}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{f.answer}</p>
                </div>
                <button onClick={() => toggleFaq(f.id, f.is_active)} className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${f.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{f.is_active ? 'Activa' : 'Oculta'}</button>
                <button onClick={() => removeFaq(f.id)} className="text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
            {faqs.length === 0 && <p className="text-center text-gray-400 text-xs py-4">Todavía no hay preguntas para este producto.</p>}
          </div>

          <div className="bg-white rounded-xl border p-5">
            <div className="flex justify-between mb-3"><h2 className="font-bold text-sm">⚙️ Especificaciones</h2>
              <button onClick={() => setSpecs(s => [...s, {key:'',value:''}])} className="text-ep-navy text-xs font-semibold"><Plus className="w-3 h-3 inline mr-1"/>Agregar</button></div>
            {specs.map((s,i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_36px] gap-2 mb-2">
                <input value={s.key} onChange={e => { const n=[...specs]; n[i].key=e.target.value; setSpecs(n); }} className="input-field text-sm" placeholder="Pantalla"/>
                <input value={s.value} onChange={e => { const n=[...specs]; n[i].value=e.target.value; setSpecs(n); }} className="input-field text-sm" placeholder="5 pulgadas"/>
                <button onClick={() => setSpecs(s => s.filter((_,j) => j!==i))} className="bg-red-50 text-red-500 rounded-lg flex items-center justify-center"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border p-5">
            <div className="flex justify-between mb-3"><h2 className="font-bold text-sm">🎨 Variantes</h2>
              <button onClick={() => setVariants(v => [...v, {name:'Color',value:'',price_modifier:'0',stock:'0'}])} className="text-ep-navy text-xs font-semibold"><Plus className="w-3 h-3 inline mr-1"/>Agregar</button></div>
            {variants.map((v,i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_80px_80px_36px] gap-2 mb-2">
                <input value={v.name||''} onChange={e => { const n=[...variants]; n[i].name=e.target.value; setVariants(n); }} className="input-field text-sm" placeholder="Color"/>
                <input value={v.value||''} onChange={e => { const n=[...variants]; n[i].value=e.target.value; setVariants(n); }} className="input-field text-sm" placeholder="Negro"/>
                <input value={v.price_modifier||''} onChange={e => { const n=[...variants]; n[i].price_modifier=e.target.value; setVariants(n); }} className="input-field text-sm" placeholder="+$"/>
                <input value={v.stock||''} onChange={e => { const n=[...variants]; n[i].stock=e.target.value; setVariants(n); }} className="input-field text-sm" placeholder="Stock"/>
                <button onClick={() => setVariants(v => v.filter((_,j) => j!==i))} className="bg-red-50 text-red-500 rounded-lg flex items-center justify-center"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="font-bold text-sm">💰 Precio</h2>
            <div><label className="label">Precio ($)</label><input type="number" value={form.price||''} onChange={set('price')} className="input-field"/></div>
            <div><label className="label">Precio tachado ($)</label><input type="number" value={form.compare_at_price||''} onChange={set('compare_at_price')} className="input-field"/></div>
            <div><label className="label">SKU</label><input value={form.sku||''} onChange={set('sku')} className="input-field"/></div>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-bold text-sm mb-2">📁 Categoría</h2>
            <select value={form.category_id||''} onChange={set('category_id')} className="input-field bg-white">
              <option value="">Sin categoría</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-xl border p-5 space-y-2">
            <label className="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={set('is_active')} className="w-4 h-4 accent-[#1c2f6b]"/><span className="text-sm">Activo (visible)</span>
            </label>
            <label className="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={set('is_featured')} className="w-4 h-4 accent-[#1c2f6b]"/><span className="text-sm">Destacado (home)</span>
            </label>
          </div>
          <a href={`/productos/${form.slug}`} target="_blank" className="block text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm py-2.5 rounded-xl">🌐 Ver en tienda →</a>
        </div>
      </div>
    </div>
  );
}
