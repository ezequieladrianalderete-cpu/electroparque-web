'use client';
import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function OfertasAdminPage() {
  const { supabase, loading: authLoading } = useAdmin();
  const [offers, setOffers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [form, setForm] = useState({ name:'', discount_type:'percentage', discount_value:'', product_id:'', starts_at:'', ends_at:'' });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { if (!authLoading) load(); }, [authLoading]);
  const load = async () => {
    const [{ data: o }, { data: p }] = await Promise.all([
      supabase.from('offers').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('id,name').eq('is_active', true),
    ]);
    setOffers(o || []); setProducts(p || []); setLoaded(true);
  };

  const add = async () => {
    if (!form.name.trim() || !form.discount_value) return;
    setSaving(true);
    await supabase.from('offers').insert({
      name: form.name, discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      product_id: form.product_id || null,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : new Date().toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      is_active: true,
    });
    setForm({ name:'', discount_type:'percentage', discount_value:'', product_id:'', starts_at:'', ends_at:'' });
    await load(); setSaving(false);
  };

  const remove = async (id: string) => { if (confirm('¿Eliminar oferta?')) { await supabase.from('offers').delete().eq('id', id); await load(); } };
  const toggle = async (id: string, active: boolean) => { await supabase.from('offers').update({ is_active: !active }).eq('id', id); await load(); };

  if (authLoading || !loaded) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>;

  const formatDate = (d: string) => { try { return new Date(d).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }); } catch { return d; } };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/admin/dashboard" className="p-2 border rounded-lg"><ArrowLeft className="w-4 h-4"/></Link>
        <h1 className="font-bold text-lg">Ofertas ({offers.length})</h1>
      </div>
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <div className="bg-white rounded-xl border p-5 space-y-3">
          <h2 className="font-bold text-sm">⚡ Nueva oferta</h2>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="input-field" placeholder="Nombre de la oferta"/>
            <select value={form.discount_type} onChange={e=>setForm(f=>({...f,discount_type:e.target.value}))} className="input-field bg-white">
              <option value="percentage">Porcentaje (%)</option>
              <option value="fixed">Monto fijo ($)</option>
            </select>
            <input type="number" value={form.discount_value} onChange={e=>setForm(f=>({...f,discount_value:e.target.value}))} className="input-field" placeholder={form.discount_type==='percentage'?'Ej: 25':'Ej: 10000'}/>
            <select value={form.product_id} onChange={e=>setForm(f=>({...f,product_id:e.target.value}))} className="input-field bg-white">
              <option value="">Todos los productos</option>
              {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div><label className="label">Inicio (opcional)</label><input type="datetime-local" value={form.starts_at} onChange={e=>setForm(f=>({...f,starts_at:e.target.value}))} className="input-field"/></div>
            <div><label className="label">Fin (para countdown)</label><input type="datetime-local" value={form.ends_at} onChange={e=>setForm(f=>({...f,ends_at:e.target.value}))} className="input-field"/></div>
          </div>
          <p className="text-xs text-gray-400">💡 La fecha de fin es la que aparece como cuenta regresiva en la home. Usá tu hora local.</p>
          <button onClick={add} disabled={saving} className="bg-ep-navy text-white font-bold px-6 py-2.5 rounded-xl disabled:opacity-50"><Plus className="w-4 h-4 inline mr-1"/>Crear oferta</button>
        </div>
        <div className="space-y-3">
          {offers.map(o => (
            <div key={o.id} className="bg-white rounded-xl border p-4 flex items-center gap-4">
              <span className="text-2xl">🏷️</span>
              <div className="flex-1">
                <p className="font-semibold text-sm">{o.name}</p>
                <p className="text-xs text-gray-500">{o.discount_type === 'percentage' ? `${o.discount_value}% OFF` : `$${Number(o.discount_value).toLocaleString('es-AR')} OFF`}</p>
                {o.ends_at && <p className="text-xs text-ep-red font-mono mt-1">Hasta: {formatDate(o.ends_at)}</p>}
              </div>
              <button onClick={() => toggle(o.id, o.is_active)} className={`text-xs font-bold px-3 py-1 rounded-full ${o.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{o.is_active ? 'Activa' : 'Inactiva'}</button>
              <button onClick={() => remove(o.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
            </div>
          ))}
          {offers.length === 0 && <p className="text-center text-gray-400 py-10">No hay ofertas creadas</p>}
        </div>
      </div>
    </div>
  );
}
