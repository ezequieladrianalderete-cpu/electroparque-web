'use client';
import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { Check, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ResenasPage() {
  const { supabase, loading: authLoading } = useAdmin();
  const [reviews, setReviews] = useState<any[]>([]);
  useEffect(() => { load(); }, []);
  const load = async () => { const { data } = await supabase.from('reviews').select('*, product:products(name)').order('created_at', { ascending: false }); setReviews(data || []); };
  const approve = async (id: string) => { await supabase.from('reviews').update({ is_approved: true }).eq('id', id); await load(); };
  const reject = async (id: string) => { await supabase.from('reviews').delete().eq('id', id); await load(); };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/admin/dashboard" className="p-2 border rounded-lg hover:bg-gray-50"><ArrowLeft className="w-4 h-4"/></Link>
        <h1 className="font-bold text-lg">Reseñas</h1>
      </div>
      <div className="max-w-4xl mx-auto p-6 space-y-3">
        {reviews.map(r => (
          <div key={r.id} className="bg-white rounded-xl border p-4 flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-yellow-400 text-sm">{'★'.repeat(r.rating)}</span>
                <span className="font-semibold text-sm">{r.customer_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.is_approved ? 'Aprobada' : 'Pendiente'}</span>
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
