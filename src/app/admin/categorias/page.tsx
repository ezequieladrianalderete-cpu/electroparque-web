'use client';
import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CategoriasPage() {
  const { supabase, loading: authLoading } = useAdmin();
  const [cats, setCats] = useState<any[]>([]);
  const [newCat, setNewCat] = useState({ name: '', slug: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => { const { data } = await supabase.from('categories').select('*').order('sort_order'); setCats(data || []); };

  const add = async () => {
    if (!newCat.name.trim()) return;
    setSaving(true);
    const slug = newCat.slug || newCat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await supabase.from('categories').insert({ name: newCat.name, slug, description: newCat.description, is_active: true, sort_order: cats.length });
    setNewCat({ name: '', slug: '', description: '' });
    await load(); setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar categoría?')) return;
    await supabase.from('categories').delete().eq('id', id); await load();
  };

  const toggle = async (id: string, active: boolean) => {
    await supabase.from('categories').update({ is_active: !active }).eq('id', id); await load();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/admin/dashboard" className="p-2 border rounded-lg hover:bg-gray-50"><ArrowLeft className="w-4 h-4"/></Link>
        <h1 className="font-bold text-lg">Categorías</h1>
      </div>
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-bold text-sm mb-3">Nueva categoría</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input value={newCat.name} onChange={e => setNewCat(c => ({...c, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,'-')}))} className="input-field" placeholder="Nombre"/>
            <input value={newCat.slug} onChange={e => setNewCat(c => ({...c, slug: e.target.value}))} className="input-field font-mono text-xs" placeholder="slug"/>
            <button onClick={add} disabled={saving} className="bg-ep-navy text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"><Plus className="w-4 h-4"/>Crear</button>
          </div>
        </div>
        <div className="bg-white rounded-xl border divide-y">
          {cats.map(c => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-3">
              <div className="flex-1"><p className="font-semibold text-sm">{c.name}</p><p className="text-xs text-gray-400 font-mono">/{c.slug}</p></div>
              <button onClick={() => toggle(c.id, c.is_active)} className={`text-xs font-bold px-3 py-1 rounded-full ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.is_active ? 'Activa' : 'Inactiva'}</button>
              <button onClick={() => remove(c.id)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
            </div>
          ))}
          {cats.length === 0 && <p className="text-center text-gray-400 py-8">No hay categorías</p>}
        </div>
      </div>
    </div>
  );
}
