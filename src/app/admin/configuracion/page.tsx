'use client';
import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { Save, ArrowLeft, Upload, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function ConfiguracionPage() {
  const { supabase, loading: authLoading } = useAdmin();
  const [settings, setSettings] = useState<Record<string,string>>({});
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [adminMsg, setAdminMsg] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);

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
      await supabase.from('store_settings').upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    }
    setMsg('✅ Configuración guardada'); setSaving(false);
  };

  const createAdmin = async () => {
    if (!adminEmail || !adminPass || adminPass.length < 6) { setAdminMsg('Email y contraseña (mín 6 chars) requeridos'); return; }
    setCreatingAdmin(true); setAdminMsg('');
    const res = await fetch('/api/admin/create-user', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPass })
    });
    const data = await res.json();
    if (data.error) { setAdminMsg('❌ ' + data.error); }
    else { setAdminMsg('✅ Admin creado: ' + data.user.email); setAdminEmail(''); setAdminPass(''); }
    setCreatingAdmin(false);
  };

  if (authLoading || !loaded) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>;

  const fields: [string,string,string][] = [
    ['store_name','Nombre de la tienda','Electro Parque'],
    ['store_tagline','Eslogan','Importación y distribución'],
    ['store_email','Email de contacto','contacto@electroparque.com'],
    ['whatsapp_number','WhatsApp (con código país, sin +)','541138848412'],
    ['store_location','Ubicación','Morón, Buenos Aires'],
    ['shipping_free_threshold','Envío gratis desde ($)','50000'],
    ['shipping_default_cost','Costo envío ($)','2500'],
    ['instagram_url','Instagram URL',''],
    ['facebook_url','Facebook URL',''],
    ['footer_text','Texto footer','© 2025 Electro Parque'],
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/admin/dashboard" className="p-2 border rounded-lg"><ArrowLeft className="w-4 h-4"/></Link>
        <h1 className="font-bold text-lg flex-1">Configuración</h1>
        <button onClick={save} disabled={saving} className="bg-ep-navy text-white px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 disabled:opacity-50"><Save className="w-4 h-4"/>{saving?'Guardando...':'Guardar'}</button>
      </div>
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        {msg && <div className={`p-3 rounded-xl text-sm ${msg.includes('✅')?'bg-green-50 text-green-700 border border-green-200':'bg-red-50 text-red-700 border border-red-200'}`}>{msg}</div>}

        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-bold text-sm mb-3">🖼️ Logo</h2>
          <div className="flex items-center gap-4">
            <div className="w-40 h-20 bg-gray-50 border-2 border-dashed rounded-xl flex items-center justify-center overflow-hidden">
              {logoPreview ? <img src={logoPreview} alt="Logo" className="max-h-full max-w-full object-contain"/> : <span className="text-gray-400 text-sm">Sin logo</span>}
            </div>
            <label className="bg-ep-navy text-white px-4 py-2 rounded-lg text-sm font-bold cursor-pointer inline-flex items-center gap-2">
              <Upload className="w-4 h-4"/>Subir logo
              <input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(f){setLogoFile(f);setLogoPreview(URL.createObjectURL(f));}}} className="hidden"/>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-bold text-sm">⚙️ Datos de la tienda</h2>
          {fields.map(([key,label,ph])=>(<div key={key}><label className="label">{label}</label><input value={settings[key]||''} onChange={e=>setSettings(s=>({...s,[key]:e.target.value}))} className="input-field" placeholder={ph}/></div>))}
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-bold text-sm mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4"/>Crear usuario admin</h2>
          {adminMsg && <div className={`p-3 rounded-xl text-sm mb-3 ${adminMsg.includes('✅')?'bg-green-50 text-green-700':'bg-red-50 text-red-700'}`}>{adminMsg}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input value={adminEmail} onChange={e=>setAdminEmail(e.target.value)} className="input-field" placeholder="email@admin.com" type="email"/>
            <input value={adminPass} onChange={e=>setAdminPass(e.target.value)} className="input-field" placeholder="Contraseña (mín 6)" type="password"/>
            <button onClick={createAdmin} disabled={creatingAdmin} className="bg-ep-navy text-white font-bold rounded-xl text-sm disabled:opacity-50">{creatingAdmin?'Creando...':'Crear admin'}</button>
          </div>
          <p className="text-xs text-gray-400 mt-2">El nuevo admin podrá loguearse en /admin/login con esas credenciales.</p>
        </div>
      </div>
    </div>
  );
}
