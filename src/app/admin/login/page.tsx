'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError('Email o contraseña incorrectos'); setLoading(false); return; }
    if (data.session) {
      router.push('/admin/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1c2f6b] rounded-2xl flex items-center justify-center mx-auto mb-4"><span className="text-white font-bold text-xl">EP</span></div>
          <h1 className="text-2xl font-bold">Panel de Administración</h1>
          <p className="text-gray-500 text-sm mt-1">Electro Parque</p>
        </div>
        <form onSubmit={handleLogin} className="bg-white rounded-2xl border p-6 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl">{error}</div>}
          <div><label className="label">Email</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="input-field"/></div>
          <div><label className="label">Contraseña</label><input type="password" required value={password} onChange={e=>setPassword(e.target.value)} className="input-field"/></div>
          <button type="submit" disabled={loading} className="w-full bg-[#1c2f6b] hover:bg-[#253d8a] disabled:opacity-50 text-white font-bold py-3 rounded-xl">{loading ? 'Ingresando...' : 'Ingresar'}</button>
          <p className="text-center text-xs text-gray-400"><a href="/" className="hover:text-[#1c2f6b]">← Volver a la tienda</a></p>
        </form>
      </div>
    </div>
  );
}
