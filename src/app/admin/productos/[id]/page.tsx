'use client';
import { useState, useEffect, use } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { Upload, X, Plus, Trash2, ArrowLeft, Save } from 'lucide-react';

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
  const [specs, setSpecs] = useState<{key:string;value:string}[]>([]);
  const [variants, setVariants] = useState<any[]>([]);

  useEffect(() => { if (!authLoading) load(); }, [authLoading]);

  const load = async () => {
    const [{ data: product }, { data: images }, { data: vars }, { data: categories }] = await Promise.all([
      supabase.from('products').select('*').eq('id', id).single(),
      supabase.from('product_images').select('*').eq('product_id', id).order('sort_order'),
      supabase.from('product_variants').select('*').eq('product_id', id).order('sort_order'),
      supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
    ]);
    if (!product) { router.push('/admin/productos'); return; }
    setForm({ ...product, tags: product.tags?.join(', ') || '' });
    setExistingImages(images || []);
    setVariants((vars || []).map((v:any) => ({ ...v, price_modifier: String(v.price_modifier), stock: String(v.stock) })));
    setSpecs(product.specs ? Object.entries(product.specs).map(([key, value]) => ({ key, value: value as string })) : []);
    setCats(categories || []);
  };

  const set = (k:string) => (e:any) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f:any) => ({ ...f, [k]: val }));
  };

  const save = async () => {
    setSaving(true); setMsg('');
    const specsObj: Record<string,string> = {};
    specs.filter(s => s.key.trim()).forEach(s => specsObj[s.key] = s.value);

    const { error } = await supabase.from('products').update({
      name: form.name, slug: form.slug, short_description: form.short_description,
      description: form.description, price: parseFloat(form.price), 
      compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      sku: form.sku || null, category_id: form.category_id || null,
      is_active: form.is_active, is_featured: form.is_featured,
      tags: form.tags ? form.tags.split(',').map((t:string) => t.trim()) : [],
      specs: specsObj, video_url: form.video_url || null,
    }).eq('id', id);

    if (error) { setMsg('Error: ' + error.message); setSaving(false); return; }

    // Upload new images
    for (let i = 0; i < newImages.length; i++) {
      const ext = newImages[i].file.name.split('.').pop();
      const path = `${id}/${Date.now()}-${i}.${ext}`;
      const { error: upErr } = await supabase.storage.from('products').upload(path, newImages[i].file);
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(path);
        await supabase.from('product_images').insert({ product_id: id, url: publicUrl, is_primary: existingImages.length === 0 && i === 0, sort_order: existingImages.length + i });
      }
    }

    // Update variants
    await supabase.from('product_variants').delete().eq('product_id', id);
    for (const v of variants.filter(v => v.name?.trim() && v.value?.trim())) {
      await supabase.from('product_variants').insert({ product_id: id, name: v.name, value: v.value, price_modifier: parseFloat(v.price_modifier) || 0, stock: parseInt(v.stock) || 0 });
    }

    setMsg('✅ Producto actualizado');
    setNewImages([]);
    await load();
    setSaving(false);
  };

  const deleteImage = async (imgId: string) => {
    await supabase.from('product_images').delete().eq('id', imgId);
    await load();
  };

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
            <div><label className="label">Descripción HTML completa</label><textarea value={form.description||''} onChange={set('description')} rows={10} className="input-field resize-none font-mono text-xs" placeholder="<h2>Título</h2><p>Texto</p><ul><li>Item</li></ul>"/></div>
            <div><label className="label">🎬 URL de video (YouTube, etc.)</label><input value={form.video_url||''} onChange={set('video_url')} className="input-field" placeholder="https://youtube.com/watch?v=..."/></div>
            <div><label className="label">Tags (coma separados)</label><input value={form.tags||''} onChange={set('tags')} className="input-field"/></div>
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

          <div className="bg-white rounded-xl border p-5">
            <div className="flex justify-between mb-3"><h2 className="font-bold text-sm">⚙️ Especificaciones</h2>
              <button onClick={() => setSpecs(s => [...s, {key:'',value:''}])} className="text-ep-navy text-xs font-semibold"><Plus className="w-3 h-3 inline mr-1"/>Agregar</button></div>
            {specs.map((s,i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_36px] gap-2 mb-2">
                <input value={s.key} onChange={e => { const n=[...specs]; n[i].key=e.target.value; setSpecs(n); }} className="input-field text-sm" placeholder="Ej: Pantalla"/>
                <input value={s.value} onChange={e => { const n=[...specs]; n[i].value=e.target.value; setSpecs(n); }} className="input-field text-sm" placeholder="Ej: 5 pulgadas"/>
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
