'use client';
import { useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'next/navigation';
import { Upload, X, Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NuevoProductoPage() {
  const { supabase, loading: authLoading } = useAdmin();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<{file: File; preview: string}[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ name:'', slug:'', short_description:'', description:'', price:'', compare_at_price:'', sku:'', category_id:'', is_active:true, is_featured:false, tags:'' });
  const [specs, setSpecs] = useState<{key:string;value:string}[]>([{key:'',value:''}]);
  const [variants, setVariants] = useState<{name:string;value:string;price_modifier:string;stock:string}[]>([]);

  if (!authLoading && !loaded) { supabase.from('categories').select('*').eq('is_active',true).order('sort_order').then(({data})=>{setCats(data||[]);setLoaded(true)}); }

  const set = (k:string) => (e:any) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({...f, [k]: val, ...(k==='name' ? {slug: val.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-+$/,'')} : {})}));
  };

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(file => setImages(prev => [...prev, {file, preview: URL.createObjectURL(file)}]));
  };

  const save = async () => {
    if (!form.name || !form.price) { setMsg('Nombre y precio son obligatorios'); return; }
    setSaving(true); setMsg('');
    const specsObj: Record<string,string> = {};
    specs.filter(s=>s.key.trim()).forEach(s => specsObj[s.key]=s.value);

    const { data: product, error } = await supabase.from('products').insert({
      name: form.name, slug: form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g,'-'),
      short_description: form.short_description, description: form.description,
      price: parseFloat(form.price), compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
      sku: form.sku || null, category_id: form.category_id || null,
      is_active: form.is_active, is_featured: form.is_featured,
      tags: form.tags ? form.tags.split(',').map(t=>t.trim()) : [], specs: specsObj,
    }).select().single();

    if (error) { setMsg('Error: ' + error.message); setSaving(false); return; }

    for (let i = 0; i < images.length; i++) {
      const ext = images[i].file.name.split('.').pop();
      const path = `${product.id}/${Date.now()}-${i}.${ext}`;
      const { error: upErr } = await supabase.storage.from('products').upload(path, images[i].file);
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(path);
        await supabase.from('product_images').insert({ product_id: product.id, url: publicUrl, is_primary: i === 0, sort_order: i });
      } else { setMsg('Error subiendo imagen: ' + upErr.message); }
    }

    for (const v of variants.filter(v => v.name.trim() && v.value.trim())) {
      await supabase.from('product_variants').insert({ product_id: product.id, name: v.name, value: v.value, price_modifier: parseFloat(v.price_modifier) || 0, stock: parseInt(v.stock) || 0 });
    }

    router.push('/admin/productos');
  };

  if (authLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/admin/productos" className="p-2 border rounded-lg"><ArrowLeft className="w-4 h-4"/></Link>
        <div className="flex-1"><h1 className="font-bold text-lg">Nuevo producto</h1></div>
        <button onClick={save} disabled={saving} className="bg-ep-navy text-white px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50"><Save className="w-4 h-4"/>{saving ? 'Guardando...' : 'Guardar'}</button>
      </div>
      <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {msg && <div className={`p-3 rounded-xl text-sm ${msg.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700'}`}>{msg}</div>}
          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="font-bold text-sm">📋 Información</h2>
            <div><label className="label">Nombre *</label><input value={form.name} onChange={set('name')} className="input-field"/></div>
            <div><label className="label">Slug</label><input value={form.slug} onChange={set('slug')} className="input-field font-mono text-xs"/></div>
            <div><label className="label">Descripción corta</label><textarea value={form.short_description} onChange={set('short_description')} rows={2} className="input-field resize-none"/></div>
            <div><label className="label">Descripción HTML (acepta etiquetas HTML: h2, p, ul, li, strong, etc.)</label><textarea value={form.description} onChange={set('description')} rows={8} className="input-field resize-none font-mono text-xs" placeholder="<h2>Título</h2><p>Descripción</p><ul><li>Característica</li></ul>"/></div>
            <div><label className="label">Tags (coma separados)</label><input value={form.tags} onChange={set('tags')} className="input-field" placeholder="carplay, moto"/></div>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-bold text-sm mb-3">📸 Fotos</h2>
            <div className="grid grid-cols-4 gap-3">
              {images.map((img,i) => (
                <div key={i} className="aspect-square rounded-lg border-2 border-ep-navy overflow-hidden relative group">
                  <img src={img.preview} alt="" className="w-full h-full object-cover"/>
                  {i===0 && <span className="absolute top-1 left-1 bg-ep-navy text-white text-[8px] font-bold px-1.5 py-0.5 rounded">Principal</span>}
                  <button onClick={()=>setImages(prev=>prev.filter((_,j)=>j!==i))} className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"><X className="w-3 h-3"/></button>
                </div>
              ))}
              <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-ep-navy">
                <Upload className="w-6 h-6 text-gray-400 mb-1"/><span className="text-[10px] text-gray-400">Agregar</span>
                <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden"/>
              </label>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <div className="flex justify-between mb-3"><h2 className="font-bold text-sm">⚙️ Especificaciones</h2>
              <button onClick={()=>setSpecs(s=>[...s,{key:'',value:''}])} className="text-ep-navy text-xs font-semibold flex items-center gap-1"><Plus className="w-3 h-3"/>Agregar</button></div>
            {specs.map((s,i)=>(
              <div key={i} className="grid grid-cols-[1fr_1fr_36px] gap-2 mb-2">
                <input value={s.key} onChange={e=>{const n=[...specs];n[i].key=e.target.value;setSpecs(n);}} className="input-field text-sm" placeholder="Ej: Pantalla"/>
                <input value={s.value} onChange={e=>{const n=[...specs];n[i].value=e.target.value;setSpecs(n);}} className="input-field text-sm" placeholder="Ej: 5 pulgadas"/>
                <button onClick={()=>setSpecs(s=>s.filter((_,j)=>j!==i))} className="bg-red-50 text-red-500 rounded-lg flex items-center justify-center"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border p-5">
            <div className="flex justify-between mb-3"><h2 className="font-bold text-sm">🎨 Variantes</h2>
              <button onClick={()=>setVariants(v=>[...v,{name:'Color',value:'',price_modifier:'0',stock:'0'}])} className="text-ep-navy text-xs font-semibold flex items-center gap-1"><Plus className="w-3 h-3"/>Agregar</button></div>
            {variants.map((v,i)=>(
              <div key={i} className="grid grid-cols-[1fr_1fr_80px_80px_36px] gap-2 mb-2">
                <input value={v.name} onChange={e=>{const n=[...variants];n[i].name=e.target.value;setVariants(n);}} className="input-field text-sm" placeholder="Color"/>
                <input value={v.value} onChange={e=>{const n=[...variants];n[i].value=e.target.value;setVariants(n);}} className="input-field text-sm" placeholder="Negro"/>
                <input value={v.price_modifier} onChange={e=>{const n=[...variants];n[i].price_modifier=e.target.value;setVariants(n);}} className="input-field text-sm" placeholder="+$"/>
                <input value={v.stock} onChange={e=>{const n=[...variants];n[i].stock=e.target.value;setVariants(n);}} className="input-field text-sm" placeholder="Stock"/>
                <button onClick={()=>setVariants(v=>v.filter((_,j)=>j!==i))} className="bg-red-50 text-red-500 rounded-lg flex items-center justify-center"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-5 space-y-3">
            <h2 className="font-bold text-sm">💰 Precio</h2>
            <div><label className="label">Precio ($) *</label><input type="number" value={form.price} onChange={set('price')} className="input-field"/></div>
            <div><label className="label">Precio tachado ($)</label><input type="number" value={form.compare_at_price} onChange={set('compare_at_price')} className="input-field"/></div>
            <div><label className="label">SKU</label><input value={form.sku} onChange={set('sku')} className="input-field"/></div>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-bold text-sm mb-2">📁 Categoría</h2>
            <select value={form.category_id} onChange={set('category_id')} className="input-field bg-white">
              <option value="">Sin categoría</option>
              {cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-xl border p-5 space-y-2">
            <h2 className="font-bold text-sm">👁️ Visibilidad</h2>
            <label className="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={set('is_active')} className="w-4 h-4 accent-[#1c2f6b]"/>
              <span className="text-sm">Activo</span>
            </label>
            <label className="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={set('is_featured')} className="w-4 h-4 accent-[#1c2f6b]"/>
              <span className="text-sm">Destacado (home)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
