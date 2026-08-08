'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { ArrowLeft, CheckCircle2, XCircle, RefreshCw, HeartPulse } from 'lucide-react';
import Link from 'next/link';

interface CheckResult { name: string; ok: boolean; detail: string; }

export default function SaludPage() {
  const { supabase, loading: authLoading } = useAdmin();
  const [checks, setChecks] = useState<CheckResult[] | null>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(async () => {
    setRunning(true); setError('');
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch('/api/admin/healthcheck', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al chequear');
      setChecks(data.checks); setCheckedAt(data.checkedAt);
    } catch (e: any) {
      setError(e.message);
    } finally { setRunning(false); }
  }, [supabase]);

  useEffect(() => { if (!authLoading) run(); }, [authLoading, run]);

  const failing = (checks || []).filter(c => !c.ok);

  if (authLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/admin/dashboard" className="p-2 border rounded-lg"><ArrowLeft className="w-4 h-4" /></Link>
        <div className="flex-1">
          <h1 className="font-bold text-lg flex items-center gap-2"><HeartPulse className="w-5 h-5" />Salud del sitio</h1>
          <p className="text-xs text-gray-500">{checkedAt ? `Último chequeo: ${new Date(checkedAt).toLocaleString('es-AR')}` : 'Chequeando...'}</p>
        </div>
        <button onClick={run} disabled={running} className="flex items-center gap-2 bg-ep-navy text-white font-bold text-sm px-4 py-2 rounded-lg disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} /> {running ? 'Chequeando...' : 'Volver a chequear'}
        </button>
      </div>

      <div className="max-w-3xl mx-auto p-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl mb-4">{error}</div>}

        {checks && (
          <div className={`rounded-xl p-5 mb-6 border ${failing.length === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            {failing.length === 0 ? (
              <p className="font-bold text-green-700 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Todo funcionando bien — {checks.length} chequeos pasados.</p>
            ) : (
              <p className="font-bold text-red-700 flex items-center gap-2"><XCircle className="w-5 h-5" /> {failing.length} de {checks.length} chequeos con problemas.</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          {(checks || []).map((c, i) => (
            <div key={i} className={`flex items-start gap-3 bg-white rounded-xl border p-4 ${!c.ok ? 'border-red-200' : ''}`}>
              {c.ok ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
              <div className="min-w-0">
                <p className="text-sm font-semibold">{c.name}</p>
                <p className={`text-xs mt-0.5 ${c.ok ? 'text-gray-400' : 'text-red-600 font-medium'}`}>{c.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
