'use client';
import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { Check, X, ArrowLeft, Star, Upload, Plus } from 'lucide-react';
import Link from 'next/link';

export default function ResenasPage() {
  const { supabase, loading: authLoading } = useAdmin();
  const [reviews, setReviews] = useState<any[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ product_id: '', customer_name: '', rating: 5, comment: '', is_featured: true });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!authLoading) { load(); loadProducts(); } }, [authLoading]);
  const load = async () => { const { data } = await supabase.from('reviews').select('*, product:products(name)').order('created_at', { ascending: false }); setReviews(data || []); };
  const loadProducts = async () => { const { data } = await supabase.from('products').select('id,name').eq('is_active', true).order('name'); setProducts(data || []); };

  const approve = async (id: string) => { await supabase.from('reviews').update({ is_approved: true }).eq('id', id); await load(); };
  const reject = async (id: string) => { await supabase.from('reviews').delete().eq('id', id); await load(); };

  const addReview = async () => {
    if (!form.customer_name.trim() || !form.comment.trim() || !form.product_id) return;
    setSaving(true);
    let photoUrl = '';
    if (photoFile) {
      const path = `review-${Date.now()}.${photoFile.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('reviews').upload(path, photoFile);
      if (!error) { const { data: { publicUrl } } = supabase.storage.from('reviews').getPublicUrl(path); photoUrl = publicUrl; }
    }
    await supabase.from('reviews').insert({
      product_id: form.product_id, customer_name: form.customer_name, rating: form.rating,
      comment: form.comment, customer_photo_url: photoUrl || null,
      is_approved: true, is_featured: form.is_featured,
    });
    setForm({ product_id: '', customer_name: '', rating: 5, comment: '', is_featured: true }); setPhotoFile(null);
    await load(); setSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/admin/dashboard" className="p-2 border rounded-lg hover:bg-gray-50"><ArrowLeft className="w-4 h-4"/></Link>
        <h1 className="font-bold text-lg">Reseñas</h1>
      </div>
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="bg-white rounded-xl border p-5 space-y-3">
          <h2 className="font-bold text-sm">Cargar reseña a mano</h2>
          <p className="text-xs text-gray-400">Se publica de una (no queda pendiente de aprobación), para usarla como testimonio en la portada.</p>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))} className="input-field">
              <option value="">Producto...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} className="input-field" placeholder="Nombre del cliente"/>
            <div className="flex items-center gap-1 col-span-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => setForm(f => ({ ...f, rating: n }))}>
                  <Star className={`w-6 h-6 ${n <= form.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}/>
                </button>
              ))}
            </div>
            <textarea value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))} className="input-field col-span-2 resize-none" rows={3} placeholder="Comentario de la reseña"/>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex-1 min-w-[200px] border-2 border-dashed rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-ep-navy">
              <Upload className="w-5 h-5 text-gray-400"/><span className="text-sm text-gray-500">{photoFile ? photoFile.name : 'Foto del cliente (opcional)'}</span>
              <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) setPhotoFile(f); }} className="hidden"/>
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}/>
              Destacar en portada
            </label>
            <button onClick={addReview} disabled={saving} className="bg-ep-navy text-white font-bold px-6 py-3 rounded-xl disabled:opacity-50"><Plus className="w-4 h-4 inline mr-1"/>Publicar reseña</button>
          </div>
        </div>

        {reviews.map(r => (
          <div key={r.id} className="bg-white rounded-xl border p-4 flex items-start gap-4">
            {r.customer_photo_url && <img src={r.customer_photo_url} alt={r.customer_name} className="w-10 h-10 rounded-full object-cover flex-shrink-0"/>}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-yellow-400 text-sm">{'★'.repeat(r.rating)}</span>
                <span className="font-semibold text-sm">{r.customer_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.is_approved ? 'Aprobada' : 'Pendiente'}</span>
                {r.is_featured && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Destacada</span>}
              </div>
              <p className="text-sm text-gray-600">{r.comment}</p>
              <p className="text-xs text-gray-400 mt-1">Producto: {r.product?.name || '—'}</p>
            </div>
            {!r.is_approved && (
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => approve(r.id)} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"><Check className="w-4 h-4"/></button>
                <button onClick={() => reject(r.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><X className="w-4 h-4"/></button>
              </div>
            )}
          </div>
        ))}
        {reviews.length === 0 && <p className="text-center text-gray-400 py-20">No hay reseñas</p>}
      </div>
    </div>
  );
}
