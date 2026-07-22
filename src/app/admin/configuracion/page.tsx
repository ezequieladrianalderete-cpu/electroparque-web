'use client';
import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { Save, ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';

export default function ConfiguracionPage() {
  const { supabase, loading: authLoading } = useAdmin();
  const [settings, setSettings] = useState<Record<string,string>>({});
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { if (!authLoading) load(); }, [authLoading]);
  const load = async () => {
    const { data } = await supabase.from('store_settings').select('*');
    const s: Record<string,string> = {};
    (data || []).forEach((d:any) => { s[d.key] = d.value || ''; });
    setSettings(s);
    if (s.logo_url) setLogoPreview(s.logo_url);
    setLoaded(true);
  };

  const save = async () => {
    setSaving(true); setMsg('');
    if (logoFile) {
      const path = `logo-${Date.now()}.${logoFile.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('settings').upload(path, logoFile, { upsert: true });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('settings').getPublicUrl(path);
        settings.logo_url = publicUrl;
      } else { setMsg('Error subiendo logo: ' + error.message); setSaving(false); return; }
    }
    for (const [key, value] of Object.entries(settings)) {
      const { error } = await supabase.from('store_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) { setMsg('Error guardando ' + key + ': ' + error.message); setSaving(false); return; }
    }
    setMsg('✅ Configuración guardada correctamente'); setSaving(false);
  };

  if (authLoading || !loaded) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>;

  const fields: [string,string,string][] = [
    ['store_name', 'Nombre de la tienda', 'Electro Parque'],
    ['store_tagline', 'Eslogan', 'Importación y distribución de tecnología'],
    ['store_email', 'Email de contacto', 'contacto@electroparque.com'],
    ['whatsapp_number', 'WhatsApp (con código país, sin +)', '541138848412'],
    ['store_location', 'Ubicación / Dirección', 'Morón, Buenos Aires'],
    ['shipping_free_threshold', 'Envío gratis desde ($)', '50000'],
    ['shipping_default_cost', 'Costo envío ($)', '2500'],
    ['instagram_url', 'Instagram URL', ''],
    ['facebook_url', 'Facebook URL', ''],
    ['footer_text', 'Texto footer', '© 2025 Electro Parque'],
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/admin/dashboard" className="p-2 border rounded-lg"><ArrowLeft className="w-4 h-4"/></Link>
        <h1 className="font-bold text-lg flex-1">Configuración</h1>
        <button onClick={save} disabled={saving} className="bg-ep-navy text-white px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50"><Save className="w-4 h-4"/>{saving?'Guardando...':'Guardar'}</button>
      </div>
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        {msg && <div className={`p-3 rounded-xl text-sm ${msg.includes('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-bold text-sm mb-3">🖼️ Logo</h2>
          <div className="flex items-center gap-4">
            <div className="w-40 h-20 bg-gray-50 border-2 border-dashed rounded-xl flex items-center justify-center overflow-hidden">
              {logoPreview ? <img src={logoPreview} alt="Logo" className="max-h-full max-w-full object-contain"/> : <span className="text-gray-400 text-sm">Sin logo</span>}
            </div>
            <label className="bg-ep-navy text-white px-4 py-2 rounded-lg text-sm font-bold cursor-pointer inline-flex items-center gap-2">
              <Upload className="w-4 h-4"/>Subir logo
              <input type="file" accept="image/*" onChange={e => { const f=e.target.files?.[0]; if(f){setLogoFile(f);setLogoPreview(URL.createObjectURL(f));} }} className="hidden"/>
            </label>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-5 space-y-4">
          {fields.map(([key, label, ph]) => (
            <div key={key}><label className="label">{label}</label><input value={settings[key]||''} onChange={e=>setSettings(s=>({...s,[key]:e.target.value}))} className="input-field" placeholder={ph}/></div>
          ))}
        </div>
      </div>
    </div>
  );
}
