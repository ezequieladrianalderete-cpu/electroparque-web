'use client';
import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { Plus, Trash2, ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function FaqsPage() {
  const { supabase, loading: authLoading } = useAdmin();
  const [faqs, setFaqs] = useState<any[]>([]);
  const [form, setForm] = useState({ question: '', answer: '' });
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { if (!authLoading) load(); }, [authLoading]);
  const load = async () => {
    const { data } = await supabase.from('faqs').select('*').is('product_id', null).order('sort_order');
    setFaqs(data || []); setLoaded(true);
  };

  const add = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    setSaving(true);
    await supabase.from('faqs').insert({ question: form.question, answer: form.answer, is_active: true, sort_order: faqs.length });
    setForm({ question: '', answer: '' });
    await load(); setSaving(false);
  };

  const remove = async (id: string) => { if (confirm('¿Eliminar esta pregunta?')) { await supabase.from('faqs').delete().eq('id', id); await load(); } };
  const toggle = async (id: string, active: boolean) => { await supabase.from('faqs').update({ is_active: !active }).eq('id', id); await load(); };
  const move = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= faqs.length) return;
    const reordered = [...faqs];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    setFaqs(reordered);
    await Promise.all(reordered.map((f, i) => supabase.from('faqs').update({ sort_order: i }).eq('id', f.id)));
    await load();
  };

  if (authLoading || !loaded) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link href="/admin/dashboard" className="p-2 border rounded-lg"><ArrowLeft className="w-4 h-4"/></Link>
        <h1 className="font-bold text-lg">Preguntas frecuentes ({faqs.length})</h1>
      </div>
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <p className="text-sm text-gray-500">Estas preguntas generales aparecen en <code className="bg-gray-100 px-1 rounded">/preguntas-frecuentes</code>. Las preguntas de un producto en particular se cargan desde la ficha de ese producto en el admin.</p>

        <div className="bg-white rounded-xl border p-5 space-y-3">
          <h2 className="font-bold text-sm">Nueva pregunta</h2>
          <input value={form.question} onChange={e => setForm(f => ({...f, question: e.target.value}))} className="input-field" placeholder="¿Hacen envíos a todo el país?"/>
          <textarea value={form.answer} onChange={e => setForm(f => ({...f, answer: e.target.value}))} className="input-field resize-none" rows={3} placeholder="Sí, el envío es gratis a todo el país..."/>
          <button onClick={add} disabled={saving} className="bg-ep-navy text-white font-bold px-6 py-3 rounded-xl disabled:opacity-50"><Plus className="w-4 h-4 inline mr-1"/>Agregar</button>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={f.id} className="bg-white rounded-xl border p-4 flex items-start gap-4">
              <div className="flex flex-col gap-1 mt-1">
                <button onClick={() => move(i, -1)} disabled={i===0} className="p-1 rounded-md border text-gray-500 hover:bg-gray-50 disabled:opacity-30"><ChevronUp className="w-4 h-4"/></button>
                <button onClick={() => move(i, 1)} disabled={i===faqs.length-1} className="p-1 rounded-md border text-gray-500 hover:bg-gray-50 disabled:opacity-30"><ChevronDown className="w-4 h-4"/></button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{f.question}</p>
                <p className="text-xs text-gray-500 mt-1">{f.answer}</p>
              </div>
              <button onClick={() => toggle(f.id, f.is_active)} className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${f.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{f.is_active ? 'Activa' : 'Oculta'}</button>
              <button onClick={() => remove(f.id)} className="text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 className="w-4 h-4"/></button>
            </div>
          ))}
          {faqs.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">Todavía no hay preguntas cargadas.</p>}
        </div>
      </div>
    </div>
  );
}
