'use client';
import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const FIELDS: [string, string, boolean][] = [
  ['about_title', 'Título grande', false],
  ['about_subtitle', 'Subtítulo', false],
  ['about_history_1', 'Primer párrafo de "Nuestra historia"', true],
  ['about_history_2', 'Segundo párrafo', true],
];

export default function NosotrosAdminPage() {
  const { supabase, loading: authLoading } = useAdmin();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { if (!authLoading) load(); }, [authLoading]);
  const load = async () => {
    const { data } = await supabase.from('store_settings').select('key,value').in('key', FIELDS.map(f => f[0]));
    const v: Record<string, string> = {};
    (data || []).forEach(d => { if (d.value) v[d.key] = d.value; });
    setValues(v); setLoaded(true);
  };

  const save = async () => {
    setSaving(true); setMsg('');
    for (const [key] of FIELDS) {
      await supabase.from('store_settings').upsert({ key, value: values[key] || '', updated_at: new Date().toISOString() }, { onConflict: 'key' });
    }
    setMsg('✅ Guardado'); setSaving(false);
  };

  if (authLoading || !loaded) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/admin/dashboard" className="p-2 border rounded-lg"><ArrowLeft className="w-4 h-4"/></Link>
        <h1 className="font-bold text-lg flex-1">Página "Nosotros"</h1>
        <button onClick={save} disabled={saving} className="bg-ep-navy text-white px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50"><Save className="w-4 h-4"/>{saving ? 'Guardando...' : 'Guardar'}</button>
      </div>
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        {msg && <div className="p-3 rounded-xl text-sm bg-green-50 text-green-700 border border-green-200">{msg}</div>}
        <p className="text-sm text-gray-500">Estos textos se muestran en <code className="bg-gray-100 px-1 rounded">/nosotros</code>. Los 4 iconos de abajo (Productos originales, Envío, Garantía, Soporte) quedan fijos.</p>
        <div className="bg-white rounded-xl border p-5 space-y-4">
          {FIELDS.map(([key, label, isTextarea]) => (
            <div key={key}>
              <label className="label">{label}</label>
              {isTextarea ? (
                <textarea value={values[key] || ''} onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))} rows={4} className="input-field resize-none"/>
              ) : (
                <input value={values[key] || ''} onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))} className="input-field"/>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
