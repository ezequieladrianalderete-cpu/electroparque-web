'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';

export default function CambiarPasswordPage() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const router = useRouter();
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (pass.length < 6) { setError('La contraseña tiene que tener al menos 6 caracteres'); return; }
    if (pass !== pass2) { setError('Las contraseñas no coinciden'); return; }
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password: pass, data: { must_change_password: false } });
    if (err) { setError(err.message); setSaving(false); return; }
    router.replace('/admin/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1c2f6b] rounded-2xl flex items-center justify-center mx-auto mb-4"><KeyRound className="w-7 h-7 text-white" /></div>
          <h1 className="text-2xl font-bold">Elegí tu contraseña</h1>
          <p className="text-gray-500 text-sm mt-1">Es la primera vez que entrás — cambiá la contraseña que te dieron por una tuya.</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{error}</div>}
          <div><label className="label">Nueva contraseña</label><input type="password" required value={pass} onChange={e => setPass(e.target.value)} className="input-field" placeholder="Mínimo 6 caracteres" /></div>
          <div><label className="label">Repetir contraseña</label><input type="password" required value={pass2} onChange={e => setPass2(e.target.value)} className="input-field" /></div>
          <button type="submit" disabled={saving} className="w-full bg-[#1c2f6b] hover:bg-[#253d8a] disabled:opacity-50 text-white font-bold py-3 rounded-xl">{saving ? 'Guardando...' : 'Guardar y entrar'}</button>
        </form>
      </div>
    </div>
  );
}
